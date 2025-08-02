import React, { useState, useEffect, useRef } from 'react'
import { Send, Zap, AlertCircle, CheckCircle } from 'lucide-react'
import { Button, MultiSelect, LoadingSpinner } from '@/components/ui'
import ApprovalDialog, { ApprovalRequest } from '@/components/ApprovalDialog'
import { useRepositories } from '@/context'
import { useChat } from '@/hooks'
import useApproval from '@/hooks/useApproval'
import { formatRelativeTime } from '@/utils'
import { SelectOption } from '@/types'

// Helper function to format streaming content with better HTML formatting
const formatStreamingContent = (content: string): string => {
  return content
    // Convert **text** to <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert bullet points
    .replace(/^[\s]*[•·]\s*/gm, '<span class="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>')
    // Convert emoji indicators to styled badges
    .replace(/^(🚀|🎫|🌳|🔀|👤|🌿|📝|🏷️|🔄|📚|🎉)/gm, '<span class="inline-block text-lg mr-2">$1</span>')
    // Convert step headers
    .replace(/^(\*\*Step \d+:.*?\*\*)$/gm, '<div class="font-semibold text-blue-700 mb-2 pb-1 border-b border-blue-200">$1</div>')
    // Convert repository names to badges
    .replace(/📁 ([^:]+):/g, '<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 mr-2">📁 $1</span>:')
    // Convert URLs to links
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
    // Convert newlines to HTML breaks
    .replace(/\n/g, '<br>')
}

const ChatPage: React.FC = () => {
  const [message, setMessage] = useState('')
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState<ApprovalRequest | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false)
  
  const { repositories, selectedRepositories, setSelectedRepositories, loading: repoLoading } = useRepositories()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  const {
    pendingApprovals,
    submitApproval,
    getWorkflowApproval,
    refreshApprovals,
    error: approvalError,
  } = useApproval()
  
  const {
    messages,
    isStreaming,
    currentStreamMessage,
    connectionStatus,
    retryCount,
    sendMessage,
    clearMessages,
  } = useChat({
    sessionId: 'main-session',
    onError: (error) => {
      console.error('Chat error:', error)
    },
    onWorkflowEvent: (event) => {
      // Handle workflow events, including approval requirements
      if (event.workflow_id) {
        setCurrentWorkflowId(event.workflow_id)
      }
      
      // Check if this step requires approval
      if (event.step === 'human_approval' && event.status === 'running') {
        checkForPendingApproval(currentWorkflowId || event.workflow_id)
      }
    }
  })

  // Check for pending approvals when workflow ID changes
  const checkForPendingApproval = async (workflowId: string | null) => {
    if (!workflowId) return
    
    try {
      const approval = await getWorkflowApproval(workflowId)
      if (approval && !approval.is_expired) {
        setPendingApproval(approval)
        setShowApprovalDialog(true)
      }
    } catch (error) {
      console.error('Error checking for pending approval:', error)
    }
  }

  // Handle approval decision
  const handleApprovalDecision = async (approved: boolean, notes: string) => {
    if (!pendingApproval) return

    setIsSubmittingApproval(true)
    try {
      await submitApproval({
        workflow_id: pendingApproval.workflow_id,
        approved,
        notes,
        user_id: 'user'
      })
      
      setPendingApproval(null)
      setShowApprovalDialog(false)
      
      // Refresh the chat to see workflow continuation
      await refreshApprovals()
    } catch (error) {
      console.error('Error submitting approval:', error)
      // Don't close dialog on error, let user retry
    } finally {
      setIsSubmittingApproval(false)
    }
  }

  // Auto-scroll to bottom when new messages arrive or when streaming
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }

    // Scroll when messages change or when streaming
    scrollToBottom()
  }, [messages, currentStreamMessage, isStreaming])

  // Check for pending approvals when component mounts or pending approvals change
  useEffect(() => {
    if (currentWorkflowId && pendingApprovals.length > 0) {
      const workflowApproval = pendingApprovals.find(
        approval => approval.workflow_id === currentWorkflowId
      )
      if (workflowApproval && !workflowApproval.is_expired) {
        setPendingApproval(workflowApproval)
        setShowApprovalDialog(true)
      }
    }
  }, [currentWorkflowId, pendingApprovals])

  // Monitor current streaming message for approval keywords
  useEffect(() => {
    if (currentStreamMessage && currentStreamMessage.includes('Human Approval Required')) {
      // Give the backend a moment to create the approval checkpoint
      setTimeout(() => {
        if (currentWorkflowId) {
          checkForPendingApproval(currentWorkflowId)
        }
      }, 2000)
    }
  }, [currentStreamMessage, currentWorkflowId])

  // Initialize with welcome message if no messages exist
  useEffect(() => {
    if (messages.length === 0) {
      // This will be handled by the useChat hook's initial state
    }
  }, [])

  const repositoryOptions: SelectOption[] = repositories.map(repo => ({
    value: repo.id,
    label: repo.name,
    disabled: false,
  }))

  const handleSendMessage = async () => {
    if (!message.trim()) return
    if (selectedRepositories.length === 0) {
      alert('Please select at least one repository before sending a message.')
      return
    }

    await sendMessage(message, selectedRepositories)
    setMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Project Enigma</h1>
            <p className="text-gray-600">AI-powered release documentation automation</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Approval Status Indicator */}
            {pendingApproval && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApprovalDialog(true)}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <CheckCircle size={14} className="mr-1" />
                  Approval Required
                </Button>
              </div>
            )}
            
            {/* Connection Status Indicator */}
            {isStreaming && (
              <div className="flex items-center space-x-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`}></div>
                <span className={`font-medium ${
                  connectionStatus === 'connected' ? 'text-green-600' :
                  connectionStatus === 'reconnecting' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {connectionStatus === 'connected' ? 'Connected' :
                   connectionStatus === 'reconnecting' ? 'Reconnecting...' :
                   'Disconnected'}
                </span>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearMessages}
              disabled={messages.length === 0}
            >
              Clear Chat
            </Button>
          </div>
        </div>
      </header>

      {/* Repository Selection */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 min-w-0">
            Repositories:
          </label>
          <div className="flex-1">
            {repoLoading ? (
              <div className="flex items-center space-x-2 py-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-gray-500">Loading repositories...</span>
              </div>
            ) : (
              <MultiSelect
                options={repositoryOptions}
                value={selectedRepositories}
                onChange={setSelectedRepositories}
                placeholder="Select repositories to include in this workflow..."
                maxDisplayed={2}
              />
            )}
          </div>
          {selectedRepositories.length > 0 && (
            <div className="flex items-center text-sm text-green-600">
              <Zap size={14} className="mr-1" />
              {selectedRepositories.length} selected
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scroll-smooth chat-scrollbar"
        style={{
          scrollBehavior: 'smooth'
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to Project Enigma
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              I can help you automate your release documentation. Select your repositories above and describe your release workflow to get started.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg px-4 py-3 ${
                  msg.type === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  {msg.type === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div 
                      className="text-sm whitespace-pre-wrap markdown-content"
                      dangerouslySetInnerHTML={{
                        __html: formatStreamingContent(msg.content)
                      }}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className={`text-xs ${
                    msg.type === 'user' ? 'text-primary-100' : 'text-gray-500'
                  }`}>
                    {formatRelativeTime(msg.timestamp)}
                  </p>
                  {msg.status === 'error' && (
                    <AlertCircle size={14} className="text-red-500" />
                  )}
                  {msg.status === 'sending' && (
                    <LoadingSpinner size="sm" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Current streaming message */}
        {isStreaming && currentStreamMessage && (
          <div className="flex justify-start">
            <div className="max-w-3xl rounded-lg px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-gray-900 shadow-sm">
              <div className="prose prose-sm max-w-none">
                <div 
                  className="text-sm whitespace-pre-wrap markdown-content"
                  dangerouslySetInnerHTML={{
                    __html: formatStreamingContent(currentStreamMessage)
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-xs text-blue-600 font-medium">
                    {connectionStatus === 'reconnecting' 
                      ? `Reconnecting... (${retryCount}/3)` 
                      : 'AI is responding...'
                    }
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-dot"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-dot"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-dot"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Invisible element for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Describe your release workflow... (e.g., 'Create release documentation for fix version v2.1.0 with sprint branch sprint-2024-01')"
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              disabled={isStreaming}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || selectedRepositories.length === 0 || isStreaming}
            loading={isStreaming}
            icon={<Send size={16} />}
            className="px-6 relative"
          >
            {isStreaming ? 'Generating...' : 'Send'}
          </Button>
        </div>
        
        {selectedRepositories.length === 0 && (
          <p className="text-xs text-amber-600 mt-2 flex items-center">
            <AlertCircle size={12} className="mr-1" />
            Please select at least one repository to proceed
          </p>
        )}
      </div>

      {/* Approval Dialog */}
      <ApprovalDialog
        isOpen={showApprovalDialog}
        onClose={() => setShowApprovalDialog(false)}
        approval={pendingApproval}
        onApprove={handleApprovalDecision}
        isSubmitting={isSubmittingApproval}
      />

      {/* Approval Error Display */}
      {approvalError && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} />
            <span className="text-sm">{approvalError}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatPage