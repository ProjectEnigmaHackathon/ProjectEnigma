import { useState, useEffect, useCallback } from "react";
import { ApprovalRequest } from "../components/ApprovalDialog";

interface ApprovalDecision {
  workflow_id: string;
  approved: boolean;
  notes?: string;
  user_id?: string;
}

interface ApprovalResponse {
  approval_id: string;
  workflow_id: string;
  status: string;
  message: string;
  timestamp: string;
}

interface UseApprovalReturn {
  pendingApprovals: ApprovalRequest[];
  isLoading: boolean;
  error: string | null;
  submitApproval: (decision: ApprovalDecision) => Promise<ApprovalResponse>;
  refreshApprovals: () => Promise<void>;
  getWorkflowApproval: (workflowId: string) => Promise<ApprovalRequest | null>;
}

export const useApproval = (): UseApprovalReturn => {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = "/api/workflow";

  const refreshApprovals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/approval`);
      if (!response.ok) {
        throw new Error(`Failed to fetch approvals: ${response.status}`);
      }

      const data = await response.json();
      setPendingApprovals(data.pending_approvals || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch approvals";
      setError(errorMessage);
      console.error("Error fetching approvals:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getWorkflowApproval = useCallback(
    async (workflowId: string): Promise<ApprovalRequest | null> => {
      try {
        const response = await fetch(`${API_BASE}/approval/${workflowId}`);
        if (response.status === 404) {
          return null;
        }
        if (!response.ok) {
          throw new Error(
            `Failed to fetch workflow approval: ${response.status}`
          );
        }

        return await response.json();
      } catch (err) {
        console.error("Error fetching workflow approval:", err);
        return null;
      }
    },
    []
  );

  const submitApproval = useCallback(
    async (decision: ApprovalDecision): Promise<ApprovalResponse> => {
      try {
        setError(null);

        const response = await fetch(`${API_BASE}/approval`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(decision),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.detail || `Failed to submit approval: ${response.status}`
          );
        }

        const result = await response.json();

        // Refresh approvals after successful submission
        await refreshApprovals();

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to submit approval";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [refreshApprovals]
  );

  // Auto-refresh approvals periodically
  useEffect(() => {
    refreshApprovals();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(refreshApprovals, 30000);

    return () => clearInterval(interval);
  }, [refreshApprovals]);

  return {
    pendingApprovals,
    isLoading,
    error,
    submitApproval,
    refreshApprovals,
    getWorkflowApproval,
  };
};

export default useApproval;
