'use client'

import { useState, useEffect } from 'react'
import { sessionAPI } from '@/lib/api'

interface BatchProcessingStatusProps {
  sessionId: string
  sessionName: string
}

interface BatchStatus {
  sessionStatus: string
  batchConfig: {
    batchSize: number
    delayBetweenBatches: number
    delayBetweenProfiles: number
  }
  profiles: {
    total: number
    processed: number
    pending: number
    scraped: number
    failed: number
    skipped: number
    progress: number
  }
  estimatedTimeRemaining: number
}

export default function BatchProcessingStatus({ sessionId, sessionName }: BatchProcessingStatusProps) {
  const [status, setStatus] = useState<BatchStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/batch-status`)
        if (response.ok) {
          const data = await response.json()
          setStatus(data.data)
          setError(null)
        } else {
          setError('Failed to fetch batch status')
        }
      } catch (err) {
        setError('Error fetching batch status')
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchStatus()

    // Set up polling every 5 seconds
    const interval = setInterval(fetchStatus, 5000)

    return () => clearInterval(interval)
  }, [sessionId])

  if (loading && !status) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">{error}</p>
      </div>
    )
  }

  if (!status) return null

  const currentBatch = Math.ceil((status.profiles.processed || 1) / status.batchConfig.batchSize)
  const totalBatches = Math.ceil(status.profiles.total / status.batchConfig.batchSize)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{sessionName}</h3>
            <p className="text-sm text-gray-500">Batch Processing Status</p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            status.sessionStatus === 'active' ? 'bg-green-100 text-green-800' :
            status.sessionStatus === 'completed' ? 'bg-blue-100 text-blue-800' :
            status.sessionStatus === 'failed' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {status.sessionStatus.toUpperCase()}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${status.profiles.progress}%` }}
          />
        </div>

        {/* Batch Information */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between mb-1">
              <span>Current Batch:</span>
              <span className="font-medium">{currentBatch} / {totalBatches}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Batch Size:</span>
              <span className="font-medium">{status.batchConfig.batchSize} profiles</span>
            </div>
            <div className="flex justify-between">
              <span>Delay Between Batches:</span>
              <span className="font-medium">{status.batchConfig.delayBetweenBatches / 1000}s</span>
            </div>
          </div>
        </div>

        {/* Profile Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-semibold text-gray-900">{status.profiles.total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Processed</p>
            <p className="text-2xl font-semibold text-gray-900">{status.profiles.processed}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Success</p>
            <p className="text-2xl font-semibold text-green-600">{status.profiles.scraped}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Failed</p>
            <p className="text-2xl font-semibold text-red-600">{status.profiles.failed}</p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">✅ Scraped:</span>
            <span className="font-medium">{status.profiles.scraped}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">❌ Failed:</span>
            <span className="font-medium">{status.profiles.failed}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">🔒 Skipped (Private):</span>
            <span className="font-medium">{status.profiles.skipped}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">⏳ Pending:</span>
            <span className="font-medium">{status.profiles.pending}</span>
          </div>
        </div>

        {/* Estimated Time */}
        {status.estimatedTimeRemaining > 0 && status.sessionStatus === 'active' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              ⏱️ Estimated time remaining: <span className="font-medium">{status.estimatedTimeRemaining} minutes</span>
            </p>
          </div>
        )}

        {/* Completion Message */}
        {status.sessionStatus === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              🎉 Batch processing completed successfully!
            </p>
          </div>
        )}

        {/* Error Message */}
        {status.sessionStatus === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              ⚠️ Batch processing failed. Please check the logs for details.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}