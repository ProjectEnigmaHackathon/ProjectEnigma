import React, { createContext, useContext, useReducer } from 'react'
import { AppSettings } from '@/types'
import { useLocalStorage } from '@/hooks'

interface AppState {
  settings: AppSettings
  isLoading: boolean
  error: string | null
  notifications: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message?: string
    timestamp: Date
  }>
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'ADD_NOTIFICATION'; payload: { type: 'info' | 'success' | 'warning' | 'error'; title: string; message?: string } }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }

interface AppContextType extends AppState {
  updateSettings: (settings: Partial<AppSettings>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addNotification: (type: 'info' | 'success' | 'warning' | 'error', title: string, message?: string) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  clearError: () => void
}

const defaultSettings: AppSettings = {
  theme: 'light',
  notifications: true,
  autoSave: true,
  defaultRepositories: [],
}

const initialState: AppState = {
  settings: defaultSettings,
  isLoading: false,
  error: null,
  notifications: [],
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      }
    
    case 'ADD_NOTIFICATION':
      const newNotification = {
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...action.payload,
        timestamp: new Date(),
      }
      return {
        ...state,
        notifications: [...state.notifications, newNotification],
      }
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      }
    
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      }
    
    default:
      return state
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Load settings from localStorage
  const [persistedSettings, setPersistedSettings] = useLocalStorage<AppSettings>(
    'app-settings',
    defaultSettings
  )

  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    settings: persistedSettings,
  })

  const updateSettings = (settings: Partial<AppSettings>) => {
    const newSettings = { ...state.settings, ...settings }
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings })
    setPersistedSettings(newSettings)
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }

  const addNotification = (
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message?: string
  ) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: { type, title, message } })

    // Auto-remove success and info notifications after 5 seconds
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: `notification-${Date.now()}` })
      }, 5000)
    }
  }

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }

  const clearNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' })
  }

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }

  const value: AppContextType = {
    ...state,
    updateSettings,
    setLoading,
    setError,
    addNotification,
    removeNotification,
    clearNotifications,
    clearError,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export default AppContext