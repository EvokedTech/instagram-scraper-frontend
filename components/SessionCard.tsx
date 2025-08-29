'use client'

import { useState, useEffect } from 'react'
import { sessionAPI } from '@/lib/api'
import { useWebSocket } from '@/hooks/useWebSocket'
import socketService from '@/lib/socket'
import { notificationManager } from '@/components/NotificationContainer'

interface SessionCardProps {
  session: any
}

export default function SessionCard({ session: initialSession }: SessionCardProps) {
  const [session, setSession] = useState(initialSession)
  const [expanded, setExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { subscribe, isConnected } = useWebSocket()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update session when props change
  useEffect(() => {
    setSession(initialSession)
  }, [initialSession])

  // Subscribe to real-time updates for this session
  useEffect(() => {
    if (!isConnected || !session._id) return

    // Subscribe to this session's updates
    socketService.subscribeToSession(session._id)

    // Listen for session progress updates
    const unsubscribeProgress = subscribe('session:progress', (data: any) => {
      if (data.sessionId === session._id) {
        setSession((prev: any) => ({
          ...prev,
          stats: {
            ...prev.stats,
            scrapedProfiles: data.scrapedProfiles,
            totalProfiles: data.totalProfiles,
            currentDepth: data.currentDepth,
          },
          progressPercentage: data.progress,
        }))
      }
    })

    // Listen for session status changes
    const unsubscribeStatus = subscribe('session:statusChanged', (data: any) => {
      if (data.sessionId === session._id) {
        setSession((prev: any) => ({
          ...prev,
          status: data.status,
        }))
      }
    })

    return () => {
      socketService.unsubscribeFromSession(session._id)
      unsubscribeProgress()
      unsubscribeStatus()
    }
  }, [session._id, isConnected, subscribe])

  const triggerRefresh = () => {
    // Emit a custom event that the parent can listen to
    window.dispatchEvent(new CustomEvent('session-updated'))
  }

  const handlePause = async () => {
    try {
      await sessionAPI.pause(session._id)
      notificationManager.success('Session Paused', `"${session.name}" has been paused`)
      triggerRefresh()
    } catch (error: any) {
      console.error('Error pausing session:', error)
      notificationManager.error(
        'Failed to Pause Session',
        error.response?.data?.error || 'An unexpected error occurred'
      )
    }
  }

  const handleResume = async () => {
    try {
      await sessionAPI.resume(session._id)
      notificationManager.success('Session Resumed', `"${session.name}" is now running`)
      triggerRefresh()
    } catch (error: any) {
      console.error('Error resuming session:', error)
      notificationManager.error(
        'Failed to Resume Session',
        error.response?.data?.error || 'An unexpected error occurred'
      )
    }
  }

  const handleStop = async () => {
    if (confirm('Are you sure you want to stop this session? This will cancel all pending scraping jobs.')) {
      try {
        await sessionAPI.stop(session._id)
        notificationManager.info('Session Stopped', `"${session.name}" has been stopped`)
        triggerRefresh()
      } catch (error: any) {
        console.error('Error stopping session:', error)
        notificationManager.error(
          'Failed to Stop Session',
          error.response?.data?.error || 'An unexpected error occurred'
        )
      }
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this session?')) {
      try {
        await sessionAPI.delete(session._id)
        notificationManager.success('Session Deleted', `"${session.name}" has been deleted`)
        triggerRefresh()
      } catch (error: any) {
        console.error('Error deleting session:', error)
        notificationManager.error(
          'Failed to Delete Session',
          error.response?.data?.error || 'Cannot delete a running session. Please stop it first.'
        )
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'stopped':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: string) => {
    // Use a consistent date format to avoid hydration errors
    const d = new Date(date)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[d.getMonth()]
    const day = d.getDate()
    const hours = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    return `${month} ${day}, ${hours}:${minutes}`
  }

  // Cap progress percentage between 0 and 100 to prevent overflow
  const progressPercentage = Math.min(100, Math.max(0, session.progressPercentage || 0))

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-medium text-gray-900">{session.name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(session.status)}`}>
              {session.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Created {mounted ? formatDate(session.createdAt) : '...'}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {session.status === 'running' && (
            <>
              <button
                onClick={handleStop}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                title="Stop"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3 13H9V9h6v6z" />
                </svg>
              </button>
              <button
                onClick={handlePause}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                title="Pause"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </>
          )}
          
          {session.status === 'paused' && (
            <button
              onClick={handleResume}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Resume"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            <svg className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <button
            onClick={handleDelete}
            disabled={session.status === 'running'}
            className={`p-2 rounded ${
              session.status === 'running' 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
            }`}
            title={session.status === 'running' ? 'Stop session before deleting' : 'Delete'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Profiles</p>
          <p className="font-medium text-gray-900">{session.rootProfiles?.length || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Batch Size</p>
          <p className="font-medium text-gray-900">10</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Progress</p>
          <p className="font-medium text-gray-900">{session.stats?.scrapedProfiles || 0}/{session.stats?.totalProfiles || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Current Batch</p>
          <p className="font-medium text-gray-900">{Math.ceil((session.stats?.scrapedProfiles || 1) / 10)}/{Math.ceil((session.stats?.totalProfiles || 1) / 10)}</p>
        </div>
      </div>
      
      {/* Batch Processing Info */}
      {session.status === 'active' && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="font-medium text-blue-900">Batch Processing Active</span>
          </div>
          <p className="text-blue-700 text-xs">
            Processing profiles in batches of 10 with 30s delay between batches
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-black h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="pt-4 border-t border-gray-200 space-y-4">
          {session.description && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700">{session.description}</p>
            </div>
          )}
          
          <div>
            <p className="text-xs text-gray-500 mb-2">Root Profiles</p>
            <div className="space-y-1">
              {session.rootProfiles?.map((url: string, idx: number) => (
                <div key={idx} className="text-sm font-mono text-gray-600 truncate">
                  {url}
                </div>
              ))}
            </div>
          </div>
          
          {session.duration && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Duration</p>
              <p className="text-sm text-gray-700">{Math.round(session.duration / 1000 / 60)} minutes</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}