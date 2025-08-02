import { useState, useCallback, useRef, useEffect } from "react";
import {
  ChatMessage,
  ChatRequest,
  WorkflowEvent,
  StreamMessage,
} from "@/types";
import { chatApi } from "@/services/api";
import useLocalStorage from "./useLocalStorage";

interface UseChatOptions {
  sessionId?: string;
  onWorkflowEvent?: (event: WorkflowEvent) => void;
  onError?: (error: string) => void;
}

function useChat(options: UseChatOptions = {}) {
  const { sessionId = "default", onWorkflowEvent, onError } = options;

  // Store messages in localStorage for persistence
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>(
    `chat-messages-${sessionId}`,
    []
  );

  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamMessage, setCurrentStreamMessage] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "reconnecting"
  >("disconnected");
  const [retryCount, setRetryCount] = useState(0);
  const streamReaderRef =
    useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 3;

  // Add a new message
  const addMessage = useCallback(
    (message: Omit<ChatMessage, "id" | "timestamp">) => {
      const newMessage: ChatMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    [setMessages]
  );

  // Update message status
  const updateMessage = useCallback(
    (messageId: string, updates: Partial<ChatMessage>) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg))
      );
    },
    [setMessages]
  );

  // Send a message and handle LangGraph streaming response
  const sendMessage = useCallback(
    async (
      content: string,
      repositories: string[] = [],
      context?: Record<string, any>
    ) => {
      // Add user message
      const userMessage = addMessage({
        type: "user",
        content,
        status: "sent",
      });

      // Add assistant message placeholder
      const assistantMessage = addMessage({
        type: "assistant",
        content: "",
        status: "sending",
      });

      setIsStreaming(true);
      setCurrentStreamMessage("");
      setConnectionStatus("connected");

      try {
        const request: ChatRequest = {
          message: content,
          repositories,
          sessionId,
          context,
        };

        // Close existing stream if any
        if (streamReaderRef.current) {
          await streamReaderRef.current.cancel();
          streamReaderRef.current = null;
        }

        // Get the streaming reader from LangGraph
        const reader = await chatApi.sendMessage(request);
        streamReaderRef.current = reader;

        let fullContent = "";

        // Process streaming data
        await chatApi.processStreamingData(
          reader,
          (data: StreamMessage) => {
            // Handle different message types
            if (data.type === "content") {
              fullContent += data.content || "";
              setCurrentStreamMessage(fullContent);
              updateMessage(assistantMessage.id, {
                content: fullContent,
                status: "sending",
              });
            } else if (data.type === "workflow_event") {
              if (data.event) {
                const workflowEvent: WorkflowEvent = {
                  type: "status_update",
                  data: data.event,
                  timestamp: new Date(),
                };
                onWorkflowEvent?.(workflowEvent);
              }
            } else if (data.type === "error") {
              updateMessage(assistantMessage.id, {
                content: fullContent || `Error: ${data.error}`,
                status: "error",
              });
              setIsStreaming(false);
              setCurrentStreamMessage("");
              setConnectionStatus("disconnected");
              onError?.(data.error || "Unknown error");
            }
          },
          (error: string) => {
            // Handle stream errors
            console.error("LangGraph stream error:", error);
            setConnectionStatus("disconnected");

            if (retryCount < maxRetries) {
              console.log(
                `Stream error, attempting to reconnect... (attempt ${retryCount + 1}/${maxRetries})`
              );
              setConnectionStatus("reconnecting");
              setRetryCount((prev) => prev + 1);

              reconnectTimeoutRef.current = setTimeout(
                () => {
                  // Attempt to reconnect
                  sendMessage(content, repositories, context);
                },
                Math.min(1000 * Math.pow(2, retryCount), 10000)
              ); // Exponential backoff
            } else {
              updateMessage(assistantMessage.id, {
                content:
                  fullContent ||
                  "Error: Connection lost after maximum retry attempts",
                status: "error",
              });
              setIsStreaming(false);
              setCurrentStreamMessage("");
              onError?.("Connection lost after maximum retry attempts");
            }
          },
          () => {
            // Handle stream completion
            updateMessage(assistantMessage.id, {
              content: fullContent,
              status: "sent",
            });
            setIsStreaming(false);
            setCurrentStreamMessage("");
            setConnectionStatus("disconnected");
            setRetryCount(0);
          }
        );
      } catch (error) {
        console.error("Error sending message:", error);
        updateMessage(assistantMessage.id, {
          content: "Error: Failed to send message",
          status: "error",
        });
        setIsStreaming(false);
        setCurrentStreamMessage("");
        setConnectionStatus("disconnected");
        onError?.(error instanceof Error ? error.message : "Unknown error");
      }
    },
    [sessionId, addMessage, updateMessage, onWorkflowEvent, onError, retryCount]
  );

  // Stop streaming
  const stopStreaming = useCallback(async () => {
    if (streamReaderRef.current) {
      await streamReaderRef.current.cancel();
      streamReaderRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsStreaming(false);
    setCurrentStreamMessage("");
    setConnectionStatus("disconnected");
    setRetryCount(0);
  }, []);

  // Clear chat history
  const clearMessages = useCallback(() => {
    setMessages([]);
    stopStreaming();
  }, [setMessages, stopStreaming]);

  // Load chat history from server (optional)
  const loadHistory = useCallback(async () => {
    try {
      const response = await chatApi.getHistory(sessionId);
      if (response.success && response.data) {
        // Convert server messages to local format if needed
        // For now, we rely on localStorage
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  }, [sessionId]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamReaderRef.current) {
        streamReaderRef.current.cancel();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    isStreaming,
    currentStreamMessage,
    connectionStatus,
    retryCount,
    sendMessage,
    stopStreaming,
    clearMessages,
    addMessage,
    updateMessage,
    loadHistory,
  };
}

export default useChat;
