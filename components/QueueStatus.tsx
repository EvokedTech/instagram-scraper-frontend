'use client'

import { useState, useEffect, useCallback } from 'react'
import { queueAPI } from '@/lib/api'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function QueueStatus() {
  const [queues, setQueues] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const { subscribe, isConnected } = useWebSocket()

  const loadQueueStatus = useCallback(async () => {
    try {
      const data = await queueAPI.getStatus()
      setQueues(data)
    } catch (error) {
      console.error('Error loading queue status:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadQueueStatus()
  }, [loadQueueStatus])

  // Subscribe to real-time queue updates
  useEffect(() => {
    if (!isConnected) return

    const unsubscribe = subscribe('queue:statusUpdate', (data: any) => {
      setQueues((prev: any) => ({
        ...prev,
        [data.type]: data
      }))
    })

    return () => {
      unsubscribe()
    }
  }, [isConnected, subscribe])

  const formatQueueName = (name: string) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-100 h-8 w-32 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="animate-pulse space-y-3">
                <div className="bg-gray-200 h-4 w-1/2 rounded" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-200 h-12 rounded" />
                  <div className="bg-gray-200 h-12 rounded" />
                  <div className="bg-gray-200 h-12 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const queueEntries = Object.entries(queues)

  return (
    <div className="sticky top-8">
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-900">Queue Status</h2>
        <p className="text-sm text-gray-500">
          Real-time processing status
        </p>
      </div>
      
      {queueEntries.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-500">No active queues</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queueEntries.map(([name, status]: [string, any]) => (
            <div key={name} className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-sm text-gray-900 mb-3">
                {formatQueueName(name)}
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-yellow-600">
                    {status.waiting || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Waiting
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600">
                    {status.active || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Active
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-semibold text-blue-600">
                    {status.completed || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Done
                  </div>
                </div>
              </div>
              
              {status.failed > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Failed</span>
                    <span className="text-sm font-medium text-red-600">
                      {status.failed}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Live Indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>{isConnected ? 'Live updates' : 'Connecting...'}</span>
          </div>
        </div>
      )}
    </div>
  )
}