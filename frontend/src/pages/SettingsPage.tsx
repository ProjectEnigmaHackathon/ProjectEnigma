import React, { useState } from 'react'
import { Plus, Trash2, Save, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react'
import { Button, Input, LoadingSpinner, Modal } from '@/components/ui'
import { useRepositories, useApp } from '@/context'
import { validateRepositoryName, validateRepositoryUrl, parseGitHubUrl } from '@/utils'
import { RepositoryRequest } from '@/types'

const SettingsPage: React.FC = () => {
  const { 
    repositories, 
    loading, 
    error, 
    createRepository, 
    deleteRepository, 
    clearError 
  } = useRepositories()
  
  const { addNotification } = useApp()
  
  const [newRepo, setNewRepo] = useState<RepositoryRequest>({ name: '', url: '' })
  const [isAddingRepo, setIsAddingRepo] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; repoId: string; repoName: string }>({ 
    show: false, 
    repoId: '', 
    repoName: '' 
  })
  
  const [formErrors, setFormErrors] = useState<{ name?: string; url?: string }>({})

  const validateForm = (): boolean => {
    const nameError = validateRepositoryName(newRepo.name)
    const urlError = validateRepositoryUrl(newRepo.url)
    
    setFormErrors({
      name: nameError || undefined,
      url: urlError || undefined,
    })
    
    return !nameError && !urlError
  }

  const handleAddRepository = async () => {
    if (!validateForm()) return
    
    // Check for duplicate names
    const existingRepo = repositories.find(repo => 
      repo.name.toLowerCase() === newRepo.name.toLowerCase()
    )
    
    if (existingRepo) {
      setFormErrors({ name: 'A repository with this name already exists' })
      return
    }
    
    setIsAddingRepo(true)
    
    try {
      await createRepository(newRepo)
      setNewRepo({ name: '', url: '' })
      setFormErrors({})
      addNotification('success', 'Repository added successfully')
    } catch (error) {
      addNotification('error', 'Failed to add repository', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsAddingRepo(false)
    }
  }

  const handleDeleteRepository = async () => {
    if (!deleteConfirm.repoId) return
    
    try {
      await deleteRepository(deleteConfirm.repoId)
      addNotification('success', `Repository "${deleteConfirm.repoName}" deleted successfully`)
    } catch (error) {
      addNotification('error', 'Failed to delete repository', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setDeleteConfirm({ show: false, repoId: '', repoName: '' })
    }
  }

  const showDeleteConfirm = (repoId: string, repoName: string) => {
    setDeleteConfirm({ show: true, repoId, repoName })
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your repository configurations and system preferences.</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="ml-auto"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Repository Management */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Repository Configuration</h2>
          
          {/* Add New Repository */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Repository</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Repository Name"
                value={newRepo.name}
                onChange={(e) => setNewRepo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., frontend"
                error={formErrors.name}
                disabled={isAddingRepo}
              />
              <Input
                label="Repository URL"
                type="url"
                value={newRepo.url}
                onChange={(e) => setNewRepo(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://github.com/org/repo"
                error={formErrors.url}
                disabled={isAddingRepo}
                rightIcon={newRepo.url && parseGitHubUrl(newRepo.url) && <CheckCircle size={16} className="text-green-500" />}
              />
            </div>
            
            {newRepo.url && parseGitHubUrl(newRepo.url) && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                <CheckCircle size={14} className="inline mr-1" />
                Valid GitHub repository URL detected
              </div>
            )}
            
            <Button
              onClick={handleAddRepository}
              disabled={!newRepo.name.trim() || !newRepo.url.trim() || isAddingRepo}
              loading={isAddingRepo}
              icon={<Plus size={16} />}
              className="mt-3"
            >
              Add Repository
            </Button>
          </div>

          {/* Repository List */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Configured Repositories</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner text="Loading repositories..." />
              </div>
            ) : (
              <div className="space-y-3">
                {repositories.map((repo) => {
                  const githubInfo = parseGitHubUrl(repo.url)
                  return (
                    <div key={repo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{repo.name}</h4>
                          {githubInfo && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {githubInfo.owner}/{githubInfo.repo}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-sm text-gray-600">{repo.url}</p>
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                            title="Open repository"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showDeleteConfirm(repo.id, repo.name)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        icon={<Trash2 size={16} />}
                        title="Delete repository"
                      />
                    </div>
                  )
                })}
                {repositories.length === 0 && (
                  <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Plus className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No repositories configured yet.</p>
                    <p className="text-sm text-gray-400 mt-1">Add your first repository to get started.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* API Configuration */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Configuration</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">API Configuration Info</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>API configurations are managed via environment variables on the backend:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><code className="bg-blue-100 px-1 rounded">JIRA_TOKEN</code> - JIRA API authentication</li>
                    <li><code className="bg-blue-100 px-1 rounded">GITHUB_TOKEN</code> - GitHub API authentication</li>
                    <li><code className="bg-blue-100 px-1 rounded">CONFLUENCE_TOKEN</code> - Confluence API authentication</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, repoId: '', repoName: '' })}
        title="Delete Repository"
        description={`Are you sure you want to delete "${deleteConfirm.repoName}"? This action cannot be undone.`}
      >
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setDeleteConfirm({ show: false, repoId: '', repoName: '' })}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteRepository}
            icon={<Trash2 size={16} />}
          >
            Delete Repository
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default SettingsPage