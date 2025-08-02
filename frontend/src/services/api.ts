import {
  ApiResponse,
  Repository,
  ChatRequest,
  ChatResponse,
  RepositoryRequest,
} from "@/types";

const API_BASE_URL = "/api";

// Helper function for making API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      return {
        success: false,
        error:
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Repository API
export const repositoryApi = {
  // Get all repositories
  async getAll(): Promise<ApiResponse<Repository[]>> {
    return apiRequest<Repository[]>("/repositories");
  },

  // Get repository by ID
  async getById(id: string): Promise<ApiResponse<Repository>> {
    return apiRequest<Repository>(`/repositories/${id}`);
  },

  // Create new repository
  async create(
    repository: RepositoryRequest
  ): Promise<ApiResponse<Repository>> {
    return apiRequest<Repository>("/repositories", {
      method: "POST",
      body: JSON.stringify(repository),
    });
  },

  // Update repository
  async update(
    id: string,
    repository: Partial<RepositoryRequest>
  ): Promise<ApiResponse<Repository>> {
    return apiRequest<Repository>(`/repositories/${id}`, {
      method: "PUT",
      body: JSON.stringify(repository),
    });
  },

  // Delete repository
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/repositories/${id}`, {
      method: "DELETE",
    });
  },
};

// Helper function to parse streaming data
function parseStreamChunk(chunk: string): any[] {
  const lines = chunk.split("\n");
  const messages: any[] = [];

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      try {
        const data = JSON.parse(line.slice(6));
        messages.push(data);
      } catch (error) {
        console.warn("Failed to parse streaming data:", line);
      }
    }
  }

  return messages;
}

// Chat API with LangGraph streaming support
export const chatApi = {
  // Send chat message and get streaming response
  async sendMessage(
    request: ChatRequest
  ): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const url = `${API_BASE_URL}/chat/stream?sessionId=${request.sessionId || "default"}`;

    // Send the POST request to initiate the workflow
    const initResponse = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!initResponse.ok) {
      throw new Error(
        `HTTP ${initResponse.status}: ${initResponse.statusText}`
      );
    }

    // Get the streaming response
    const streamResponse = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/plain",
        "Cache-Control": "no-cache",
      },
    });

    if (!streamResponse.ok) {
      throw new Error(
        `HTTP ${streamResponse.status}: ${streamResponse.statusText}`
      );
    }

    if (!streamResponse.body) {
      throw new Error("Response body is null");
    }

    return streamResponse.body.getReader();
  },

  // Process streaming data from LangGraph
  async processStreamingData(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onMessage: (data: any) => void,
    onError: (error: string) => void,
    onComplete: () => void
  ): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete messages
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              onMessage(data);

              if (data.type === "complete") {
                onComplete();
                return;
              }
            } catch (error) {
              console.warn("Failed to parse streaming data:", line);
            }
          }
        }
      }

      onComplete();
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Stream processing error"
      );
    } finally {
      reader.releaseLock();
    }
  },

  // Get chat history
  async getHistory(sessionId: string): Promise<ApiResponse<ChatResponse[]>> {
    return apiRequest<ChatResponse[]>(`/chat/history/${sessionId}`);
  },

  // Send approval response
  async sendApproval(
    approvalId: string,
    approved: boolean,
    notes?: string
  ): Promise<ApiResponse<void>> {
    return apiRequest<void>("/chat/approval", {
      method: "POST",
      body: JSON.stringify({
        approvalId,
        approved,
        notes,
      }),
    });
  },
};

// Health API
export const healthApi = {
  // Check system health
  async check(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return apiRequest<{ status: string; timestamp: string }>("/health");
  },

  // Check API connectivity
  async checkConnectivity(): Promise<
    ApiResponse<{ jira: boolean; github: boolean; confluence: boolean }>
  > {
    return apiRequest<{ jira: boolean; github: boolean; confluence: boolean }>(
      "/health/connectivity"
    );
  },
};

// Default export with all APIs
const api = {
  repositories: repositoryApi,
  chat: chatApi,
  health: healthApi,
};

export default api;
