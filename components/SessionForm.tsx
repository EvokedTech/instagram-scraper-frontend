'use client'

import { useState } from 'react'
import { sessionAPI, scraperAPI } from '@/lib/api'

interface SessionFormProps {
  onSessionCreated: () => void
}

export default function SessionForm({ onSessionCreated }: SessionFormProps) {
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'info' | 'success' | 'error'
    message: string
    details?: any
  }>({ show: false, type: 'info', message: '' })
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rootProfiles: '',
    maxDepth: 2,
    maxProfilesPerDepth: 100,
  })
  
  const [unlimitedProfiles, setUnlimitedProfiles] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const profileUrls = formData.rootProfiles
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0)

      const sessionData = {
        name: formData.name,
        description: formData.description,
        rootProfiles: profileUrls,
        config: {
          maxDepth: formData.maxDepth,
          maxProfilesPerDepth: unlimitedProfiles ? null : formData.maxProfilesPerDepth,
          analysisEnabled: false,
        },
      }

      const result = await sessionAPI.create(sessionData)
      
      // Check if any profiles already exist in database
      if (result.profilesInfo && result.profilesInfo.existing > 0) {
        setNotification({
          show: true,
          type: 'info',
          message: `Found ${result.profilesInfo.existing} existing profile(s) in database!`,
          details: result.profilesInfo
        })
      } else {
        setNotification({
          show: true,
          type: 'success',
          message: 'Session created successfully. All profiles are new.',
          details: result.profilesInfo
        })
      }
      
      // Get session ID from the response
      const sessionId = result.data?._id || result.data?.id || result._id || result.id
      
      if (sessionId) {
        await scraperAPI.startBatch(sessionId)
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        rootProfiles: '',
        maxDepth: 2,
        maxProfilesPerDepth: 100,
      })
      setUnlimitedProfiles(false)

      onSessionCreated()
      
      // Hide notification after 10 seconds
      setTimeout(() => {
        setNotification({ show: false, type: 'info', message: '' })
      }, 10000)
    } catch (error: any) {
      console.error('Error creating session:', error)
      console.error('Error response structure:', error.response?.data)
      
      // Extract error message from the response
      let errorMessage = 'Failed to create session'
      if (error.response?.data?.error) {
        // Handle nested error object structure from backend
        if (typeof error.response.data.error === 'object' && error.response.data.error.message) {
          errorMessage = error.response.data.error.message
        } else if (typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error
        }
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details.join('\n')
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setNotification({
        show: true,
        type: 'error',
        message: errorMessage,
        details: error.response?.data?.details
      })
      
      // Hide error notification after 10 seconds
      setTimeout(() => {
        setNotification({ show: false, type: 'info', message: '' })
      }, 10000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">Create New Session</h2>
        <p className="text-sm text-gray-500 mt-1">
          Start a new Instagram profile scraping session
        </p>
      </div>
      
      {/* Notification */}
      {notification.show && (
        <div className={`mb-6 p-4 rounded-lg border ${
          notification.type === 'info' 
            ? 'bg-blue-50 border-blue-200 text-blue-800' 
            : notification.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === 'info' && (
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
              {notification.type === 'success' && (
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
              {notification.details && notification.details.existing > 0 && (
                <div className="mt-2 text-sm">
                  <p>• {notification.details.new} new profile(s) will be scraped</p>
                  <p>• {notification.details.existing} profile(s) already exist in database</p>
                  {notification.details.existingProfiles && notification.details.existingProfiles.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Existing profiles:</p>
                      <ul className="mt-1 space-y-1">
                        {notification.details.existingProfiles.map((profile: any, index: number) => (
                          <li key={index} className="ml-2">
                            • @{profile.username} ({profile.relatedProfilesCount} related profiles)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setNotification({ show: false, type: 'info', message: '' })}
              className="flex-shrink-0 ml-4"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Session Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            placeholder="e.g., Fashion Influencers Analysis"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            rows={3}
            placeholder="Add notes about this scraping session..."
          />
        </div>

        <div>
          <label htmlFor="profiles" className="block text-sm font-medium text-gray-700 mb-1">
            Instagram Profile URLs
          </label>
          <textarea
            id="profiles"
            required
            value={formData.rootProfiles}
            onChange={(e) => setFormData({ ...formData, rootProfiles: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono text-sm"
            rows={5}
            placeholder="https://www.instagram.com/username1/&#10;https://www.instagram.com/username2/&#10;https://www.instagram.com/username3/"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter one profile URL per line
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="depth" className="block text-sm font-medium text-gray-700 mb-1">
              Max Depth
            </label>
            <select
              id="depth"
              value={formData.maxDepth}
              onChange={(e) => setFormData({ ...formData, maxDepth: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              {[1, 2, 3, 4, 5, 6].map(depth => (
                <option key={depth} value={depth}>{depth}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              How deep to scrape
            </p>
          </div>

          <div>
            <label htmlFor="perDepth" className="block text-sm font-medium text-gray-700 mb-1">
              Profiles per Depth
            </label>
            <div className="space-y-2">
              <input
                id="perDepth"
                type="number"
                min="1"
                max="1000000"
                value={formData.maxProfilesPerDepth}
                onChange={(e) => setFormData({ ...formData, maxProfilesPerDepth: parseInt(e.target.value) })}
                disabled={unlimitedProfiles}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:bg-gray-100 disabled:text-gray-500"
              />
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={unlimitedProfiles}
                  onChange={(e) => setUnlimitedProfiles(e.target.checked)}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span>Unlimited (no limit on profiles per depth)</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {unlimitedProfiles 
                ? '⚠️ Warning: Unlimited can result in millions of profiles at deeper levels' 
                : 'Max profiles at each level'}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating Session...' : 'Start Scraping'}
        </button>
      </form>
    </div>
  )
}