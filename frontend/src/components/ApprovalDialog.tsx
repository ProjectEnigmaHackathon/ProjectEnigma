import React, { useState } from 'react'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { clsx } from 'clsx'

export interface ApprovalRequest {
  approval_id: string
  workflow_id: string
  message: string
  created_at: string
  timeout_at?: string
  is_expired?: boolean
}

interface ApprovalDialogProps {
  isOpen: boolean
  onClose: () => void
  approval: ApprovalRequest | null
  onApprove: (approved: boolean, notes: string) => Promise<void>
  isSubmitting?: boolean
}

const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  isOpen,
  onClose,
  approval,
  onApprove,
  isSubmitting = false,
}) => {
  const [notes, setNotes] = useState('')
  const [decision, setDecision] = useState<'approve' | 'deny' | null>(null)

  const handleSubmit = async () => {
    if (!decision || !approval) return

    try {
      await onApprove(decision === 'approve', notes)
      setNotes('')
      setDecision(null)
      onClose()
    } catch (error) {
      console.error('Failed to submit approval:', error)
    }
  }

  const handleClose = () => {
    setNotes('')
    setDecision(null)
    onClose()
  }

  if (!approval) return null

  const isExpired = approval.is_expired || 
    (approval.timeout_at && new Date(approval.timeout_at) < new Date())

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getTimeRemaining = () => {
    if (!approval.timeout_at) return null
    
    const timeout = new Date(approval.timeout_at)
    const now = new Date()
    const diff = timeout.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`
    }
    return `${minutes}m remaining`
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Workflow Approval Required"
      size="lg"
      closeOnOverlayClick={false}
    >
      <div className="space-y-6">
        {/* Approval Status */}
        <div className={clsx(
          'flex items-center gap-3 p-4 rounded-lg border',
          isExpired 
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        )}>
          {isExpired ? (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          ) : (
            <Clock className="w-5 h-5 text-blue-600" />
          )}
          <div className="flex-1">
            <div className="font-medium">
              {isExpired ? 'Approval Expired' : 'Approval Pending'}
            </div>
            <div className="text-sm">
              Workflow ID: {approval.workflow_id.slice(0, 8)}...
            </div>
          </div>
          {approval.timeout_at && (
            <div className="text-right text-sm">
              <div className="font-medium">{getTimeRemaining()}</div>
              <div className="text-xs opacity-75">
                Timeout: {formatTime(approval.timeout_at)}
              </div>
            </div>
          )}
        </div>

        {/* Approval Message */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900">
            Review Required
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
              {approval.message}
            </pre>
          </div>
        </div>

        {/* Decision Buttons */}
        {!isExpired && (
          <div className="space-y-4">
            <div className="flex gap-3 justify-center">
              <Button
                variant={decision === 'approve' ? 'primary' : 'outline'}
                onClick={() => setDecision('approve')}
                className={clsx(
                  'flex items-center gap-2 px-6 py-3',
                  decision === 'approve' && 'ring-2 ring-green-500 ring-offset-2'
                )}
                disabled={isSubmitting}
              >
                <CheckCircle className="w-5 h-5" />
                Approve
              </Button>
              
              <Button
                variant={decision === 'deny' ? 'danger' : 'outline'}
                onClick={() => setDecision('deny')}
                className={clsx(
                  'flex items-center gap-2 px-6 py-3',
                  decision === 'deny' && 'ring-2 ring-red-500 ring-offset-2'
                )}
                disabled={isSubmitting}
              >
                <XCircle className="w-5 h-5" />
                Deny
              </Button>
            </div>

            {/* Notes Input */}
            <div className="space-y-2">
              <label htmlFor="approval-notes" className="block text-sm font-medium text-gray-700">
                Notes (optional)
              </label>
              <textarea
                id="approval-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Add any notes about your decision..."
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {isExpired ? 'Close' : 'Cancel'}
          </Button>
          
          {!isExpired && decision && (
            <Button
              variant={decision === 'approve' ? 'primary' : 'danger'}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  {decision === 'approve' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {decision === 'approve' ? 'Approve Workflow' : 'Deny Workflow'}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Approval Details */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div>Approval ID: {approval.approval_id}</div>
          <div>Created: {formatTime(approval.created_at)}</div>
        </div>
      </div>
    </Modal>
  )
}

export default ApprovalDialog