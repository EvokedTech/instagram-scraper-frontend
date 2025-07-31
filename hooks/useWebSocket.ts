import { useEffect, useState, useCallback, useRef } from 'react';
import socketService from '@/lib/socket';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectOnError?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true, reconnectOnError = true } = options;
  const [isConnected, setIsConnected] = useState(socketService.isConnected());
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    // Listen for connection status changes
    const unsubscribeStatus = socketService.on('connection:status', ({ connected, reason }: any) => {
      setIsConnected(connected);
      if (!connected && reason) {
        setConnectionError(reason);
      } else {
        setConnectionError(null);
      }
    });

    // Listen for connection errors
    const unsubscribeError = socketService.on('connection:error', ({ error, fatal }: any) => {
      setConnectionError(error);
      
      if (reconnectOnError && !fatal) {
        // Attempt to reconnect after a delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          socketService.reconnect();
        }, 5000);
      }
    });

    // Initial connection check
    setIsConnected(socketService.isConnected());

    return () => {
      unsubscribeStatus();
      unsubscribeError();
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [autoConnect, reconnectOnError]);

  const connect = useCallback(() => {
    socketService.reconnect();
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  const subscribe = useCallback((event: string, callback: Function) => {
    return socketService.on(event, callback);
  }, []);

  const unsubscribe = useCallback((event: string, callback: Function) => {
    socketService.off(event, callback);
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketService.send(event, data);
  }, []);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    emit,
    socket: socketService,
  };
}