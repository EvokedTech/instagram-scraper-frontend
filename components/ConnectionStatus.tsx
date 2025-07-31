'use client'

import { useWebSocket } from '@/hooks/useWebSocket'
import { useEffect, useState } from 'react'

export default function ConnectionStatus() {
  const { isConnected } = useWebSocket()
  const [showStatus, setShowStatus] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)

  useEffect(() => {
    // Show status for 3 seconds when connection changes
    setShowStatus(true)
    const timer = setTimeout(() => setShowStatus(false), 3000)
    return () => clearTimeout(timer)
  }, [isConnected])

  // Listen for connection events
  useEffect(() => {
    const handleConnectionStatus = (data: any) => {
      if (!data.connected && data.reason) {
        setIsReconnecting(true)
      } else {
        setIsReconnecting(false)
      }
    }

    // Import socket service to listen to events
    import('@/lib/socket').then(({ default: socketService }) => {
      const unsubscribe = socketService.on('connection:status', handleConnectionStatus)
      return () => unsubscribe()
    })
  }, [])

  if (!showStatus && isConnected) return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${showStatus ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg ${
        isConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-white' : 'bg-white animate-pulse'
        }`} />
        <span className="text-sm font-medium">
          {isConnected ? 'Connected' : isReconnecting ? 'Reconnecting...' : 'Disconnected'}
        </span>
      </div>
    </div>
  )
}