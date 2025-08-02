// Core API types
export interface Repository {
  id: string;
  name: string;
  url: string;
  description?: string;
  isActive?: boolean;
}

// Chat related types
export interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  status?: "sending" | "sent" | "error";
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  repositories: string[]; // Repository IDs
  title?: string;
}

// Workflow related types
export interface WorkflowState {
  id: string;
  status: "pending" | "running" | "completed" | "failed" | "paused";
  step: WorkflowStep;
  repositories: Repository[];
  releaseType: "release" | "hotfix";
  sprintName: string;
  fixVersion: string;
  results?: WorkflowResults;
  error?: string;
}

export interface WorkflowStep {
  name: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  progress?: number;
  details?: Record<string, any>;
}

export interface WorkflowResults {
  jiraTickets?: JiraTicket[];
  branches?: BranchInfo[];
  pullRequests?: PullRequest[];
  tags?: GitTag[];
  confluencePage?: ConfluencePage;
}

// JIRA related types
export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  status: string;
  assignee?: string;
  fixVersion?: string;
  issueType: string;
  priority: string;
  created: Date;
  updated: Date;
}

// GitHub related types
export interface BranchInfo {
  repository: string;
  name: string;
  type: "feature" | "sprint" | "release" | "rollback" | "develop" | "master";
  sha: string;
  url: string;
  merged?: boolean;
  mergedInto?: string;
  jiraTicketId?: string;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  repository: string;
  source: string;
  target: string;
  status: "open" | "closed" | "merged";
  url: string;
  created: Date;
  merged?: Date;
}

export interface GitTag {
  name: string;
  repository: string;
  sha: string;
  message?: string;
  created: Date;
  url: string;
}

// Confluence related types
export interface ConfluencePage {
  id: string;
  title: string;
  url: string;
  spaceKey: string;
  content: string;
  created: Date;
  updated: Date;
}

// API request/response types
export interface ChatRequest {
  message: string;
  repositories: string[];
  sessionId?: string;
  context?: Record<string, any>;
  releaseType?: "release" | "hotfix";
  sprintName?: string;
  fixVersion?: string;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  workflowState?: WorkflowState;
  suggestions?: string[];
  workflowId?: string;
  status?: string;
}

export interface RepositoryRequest {
  name: string;
  url: string;
  description?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// UI Component types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "url" | "email" | "password" | "select" | "textarea";
  placeholder?: string;
  required?: boolean;
  validation?: (value: string) => string | null;
  options?: SelectOption[];
}

// Application state types
export interface AppSettings {
  theme: "light" | "dark" | "system";
  notifications: boolean;
  autoSave: boolean;
  defaultRepositories: string[];
}

export interface AppState {
  currentSession: ChatSession | null;
  repositories: Repository[];
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
}

// Utility types
export type LoadingState = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Event types for workflow streaming
export interface WorkflowEvent {
  type:
    | "status_update"
    | "step_complete"
    | "error"
    | "progress"
    | "approval_required";
  data: any;
  timestamp: Date;
}

// Streaming message types (matching backend StreamMessage)
export interface StreamMessage {
  type: "content" | "workflow_event" | "complete" | "error";
  content?: string;
  event?: Record<string, any>;
  error?: string;
}

// Human approval types
export interface ApprovalRequest {
  id: string;
  workflowId: string;
  title: string;
  description: string;
  options: ApprovalOption[];
  deadline?: Date;
}

export interface ApprovalOption {
  id: string;
  label: string;
  action: "approve" | "deny" | "modify";
  data?: Record<string, any>;
}

export interface ApprovalResponse {
  approvalId: string;
  option: string;
  notes?: string;
  timestamp: Date;
}
