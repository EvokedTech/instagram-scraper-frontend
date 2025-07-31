'use client'

import { useState, useEffect, useCallback } from 'react'
import { sessionAPI } from '@/lib/api'
import SessionCard from './SessionCard'
import { useWebSocket } from '@/hooks/useWebSocket'
import socketService from '@/lib/socket'

export default function SessionList() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { subscribe, isConnected } = useWebSocket()

  const loadSessions = useCallback(async () => {
    try {
      const response = await sessionAPI.list({ limit: 10, sort: '-createdAt' })
      console.log('Sessions response:', response) // Debug log
      // Handle different response structures
      const sessionsData = response.data || response.sessions || response || []
      // Filter out any deleted sessions (shouldn't be needed with hard delete, but just in case)
      const activeSessions = Array.isArray(sessionsData) 
        ? sessionsData.filter(s => s.status !== 'deleted') 
        : []
      setSessions(activeSessions)
    } catch (error) {
      console.error('Error loading sessions:', error)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isConnected) return

    // Subscribe to system-wide events
    socketService.subscribeToSystem()

    // Listen for any session updates
    const unsubscribeProgress = subscribe('session:progress', (data: any) => {
      setSessions(prev => prev.map(session => 
        session._id === data.sessionId
          ? {
              ...session,
              stats: {
                ...session.stats,
                scrapedProfiles: data.scrapedProfiles,
                totalProfiles: data.totalProfiles,
                currentDepth: data.currentDepth,
              },
              progressPercentage: data.progress,
            }
          : session
      ))
    })

    // Listen for session status changes
    const unsubscribeStatus = subscribe('session:statusChanged', (data: any) => {
      setSessions(prev => prev.map(session => 
        session._id === data.sessionId
          ? { ...session, status: data.status }
          : session
      ))
    })

    // Listen for new sessions or deletions (requires refreshing the list)
    const unsubscribeSystem = subscribe('system:notification', (data: any) => {
      if (data.type === 'session_created' || data.type === 'session_deleted') {
        loadSessions()
      }
    })

    // Listen for custom events (for backward compatibility)
    const handleSessionUpdate = () => {
      loadSessions()
    }
    window.addEventListener('session-updated', handleSessionUpdate)

    return () => {
      unsubscribeProgress()
      unsubscribeStatus()
      unsubscribeSystem()
      window.removeEventListener('session-updated', handleSessionUpdate)
    }
  }, [isConnected, subscribe, loadSessions])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-100 h-8 w-32 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="animate-pulse space-y-3">
                <div className="bg-gray-200 h-5 w-1/3 rounded" />
                <div className="bg-gray-200 h-4 w-1/2 rounded" />
                <div className="bg-gray-200 h-3 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-900">Sessions</h2>
        <p className="text-sm text-gray-500">
          Manage your scraping sessions
        </p>
      </div>
      
      {sessions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-2">No sessions found</p>
          <p className="text-sm text-gray-400">
            Create a new session to start scraping Instagram profiles
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard key={session._id} session={session} />
          ))}
        </div>
      )}
    </div>
  )
}