import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Repository, RepositoryRequest } from '@/types'
import { repositoryApi } from '@/services/api'

interface RepositoryState {
  repositories: Repository[]
  selectedRepositories: string[]
  loading: boolean
  error: string | null
}

type RepositoryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_REPOSITORIES'; payload: Repository[] }
  | { type: 'ADD_REPOSITORY'; payload: Repository }
  | { type: 'UPDATE_REPOSITORY'; payload: { id: string; repository: Repository } }
  | { type: 'DELETE_REPOSITORY'; payload: string }
  | { type: 'SET_SELECTED_REPOSITORIES'; payload: string[] }
  | { type: 'TOGGLE_REPOSITORY_SELECTION'; payload: string }

interface RepositoryContextType extends RepositoryState {
  // Actions
  loadRepositories: () => Promise<void>
  createRepository: (repository: RepositoryRequest) => Promise<void>
  updateRepository: (id: string, repository: Partial<RepositoryRequest>) => Promise<void>
  deleteRepository: (id: string) => Promise<void>
  setSelectedRepositories: (repositoryIds: string[]) => void
  toggleRepositorySelection: (repositoryId: string) => void
  clearError: () => void
}

const initialState: RepositoryState = {
  repositories: [],
  selectedRepositories: [],
  loading: false,
  error: null,
}

function repositoryReducer(state: RepositoryState, action: RepositoryAction): RepositoryState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    
    case 'SET_REPOSITORIES':
      return { ...state, repositories: action.payload, loading: false, error: null }
    
    case 'ADD_REPOSITORY':
      return {
        ...state,
        repositories: [...state.repositories, action.payload],
        loading: false,
        error: null,
      }
    
    case 'UPDATE_REPOSITORY':
      return {
        ...state,
        repositories: state.repositories.map(repo =>
          repo.id === action.payload.id ? action.payload.repository : repo
        ),
        loading: false,
        error: null,
      }
    
    case 'DELETE_REPOSITORY':
      return {
        ...state,
        repositories: state.repositories.filter(repo => repo.id !== action.payload),
        selectedRepositories: state.selectedRepositories.filter(id => id !== action.payload),
        loading: false,
        error: null,
      }
    
    case 'SET_SELECTED_REPOSITORIES':
      return { ...state, selectedRepositories: action.payload }
    
    case 'TOGGLE_REPOSITORY_SELECTION':
      const isSelected = state.selectedRepositories.includes(action.payload)
      return {
        ...state,
        selectedRepositories: isSelected
          ? state.selectedRepositories.filter(id => id !== action.payload)
          : [...state.selectedRepositories, action.payload],
      }
    
    default:
      return state
  }
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined)

export function RepositoryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(repositoryReducer, initialState)

  // Load repositories on mount
  useEffect(() => {
    loadRepositories()
  }, [])

  const loadRepositories = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const response = await repositoryApi.getAll()
      if (response.success && response.data) {
        dispatch({ type: 'SET_REPOSITORIES', payload: response.data })
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to load repositories' })
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Network error while loading repositories' })
    }
  }

  const createRepository = async (repository: RepositoryRequest) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const response = await repositoryApi.create(repository)
      if (response.success && response.data) {
        dispatch({ type: 'ADD_REPOSITORY', payload: response.data })
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to create repository' })
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Network error while creating repository' })
    }
  }

  const updateRepository = async (id: string, repository: Partial<RepositoryRequest>) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const response = await repositoryApi.update(id, repository)
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_REPOSITORY', payload: { id, repository: response.data } })
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to update repository' })
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Network error while updating repository' })
    }
  }

  const deleteRepository = async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const response = await repositoryApi.delete(id)
      if (response.success) {
        dispatch({ type: 'DELETE_REPOSITORY', payload: id })
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to delete repository' })
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Network error while deleting repository' })
    }
  }

  const setSelectedRepositories = (repositoryIds: string[]) => {
    dispatch({ type: 'SET_SELECTED_REPOSITORIES', payload: repositoryIds })
  }

  const toggleRepositorySelection = (repositoryId: string) => {
    dispatch({ type: 'TOGGLE_REPOSITORY_SELECTION', payload: repositoryId })
  }

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }

  const value: RepositoryContextType = {
    ...state,
    loadRepositories,
    createRepository,
    updateRepository,
    deleteRepository,
    setSelectedRepositories,
    toggleRepositorySelection,
    clearError,
  }

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  )
}

export function useRepositories() {
  const context = useContext(RepositoryContext)
  if (context === undefined) {
    throw new Error('useRepositories must be used within a RepositoryProvider')
  }
  return context
}

export default RepositoryContext