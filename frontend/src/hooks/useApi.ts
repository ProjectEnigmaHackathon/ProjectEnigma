import { useState, useCallback } from 'react'
import { ApiResponse, AsyncState } from '@/types'

/**
 * Custom hook for managing API calls with loading states
 */
function useApi<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async (
    apiCall: () => Promise<ApiResponse<T>>,
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void
  ) => {
    setState({ data: null, loading: true, error: null })

    try {
      const response = await apiCall()
      
      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null })
        onSuccess?.(response.data)
      } else {
        const errorMessage = response.error || 'Unknown error occurred'
        setState({ data: null, loading: false, error: errorMessage })
        onError?.(errorMessage)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error'
      setState({ data: null, loading: false, error: errorMessage })
      onError?.(errorMessage)
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

export default useApi