import { io, Socket } from 'socket.io-client';

// Event types for type safety
export interface SessionProgressData {
  sessionId: string;
  currentDepth: number;
  totalProfiles: number;
  scrapedProfiles: number;
  progress: number;
  status: string;
}

export interface ProfileUpdateData {
  sessionId: string;
  profileUrl: string;
  username: string;
  depth: number;
  status: 'pending' | 'scraping' | 'scraped' | 'failed';
  error?: string;
}

export interface QueueStatusData {
  type: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  paused: number;
  delayed: number;
}

export interface BatchProcessingData {
  sessionId: string;
  depth: number;
  batchSize: number;
  processedCount: number;
  totalCount: number;
  currentBatch: string[];
}

export interface SystemMetricsData {
  totalSessions: number;
  activeSessions: number;
  totalProfiles: number;
  queueStats: QueueStatusData;
  processingRate: number;
  apiCreditsUsed: number;
  systemHealth: {
    mongodb: boolean;
    redis: boolean;
    api: boolean;
  };
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private subscribedSessions: Set<string> = new Set();

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
      // Connect immediately without delay
      this.connect();
    }
  }

  private connect() {
    const backendUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    this.socket = io(backendUrl, {
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      transports: ['websocket'], // Use only websocket for better performance
      upgrade: false // Don't upgrade from polling
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Re-subscribe to sessions after reconnection
      this.subscribedSessions.forEach(sessionId => {
        this.subscribeToSession(sessionId);
      });
      
      this.emit('connection:status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.emit('connection:status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('connection:error', { 
          error: 'Max reconnection attempts reached',
          fatal: true 
        });
      }
    });

    // Session events
    this.socket.on('session:progress', (data: SessionProgressData) => {
      this.emit('session:progress', data);
    });

    this.socket.on('session:statusChanged', (data: any) => {
      this.emit('session:statusChanged', data);
    });

    this.socket.on('session:depthCompleted', (data: any) => {
      this.emit('session:depthCompleted', data);
    });

    // Profile events
    this.socket.on('profile:scraped', (data: ProfileUpdateData) => {
      this.emit('profile:scraped', data);
    });

    this.socket.on('profile:failed', (data: ProfileUpdateData) => {
      this.emit('profile:failed', data);
    });

    this.socket.on('profile:statusUpdate', (data: ProfileUpdateData) => {
      this.emit('profile:statusUpdate', data);
    });

    // Handle batched profile status updates
    this.socket.on('profile:statusBatch', (data: { sessionId: string; profiles: ProfileUpdateData[]; timestamp: Date }) => {
      // Emit individual events for each profile in the batch
      data.profiles.forEach(profile => {
        this.emit('profile:statusUpdate', { ...profile, sessionId: data.sessionId });
      });
    });

    // Queue events
    this.socket.on('queue:statusUpdate', (data: QueueStatusData) => {
      this.emit('queue:statusUpdate', data);
    });

    this.socket.on('queue:jobProgress', (data: any) => {
      this.emit('queue:jobProgress', data);
    });

    // Batch processing events
    this.socket.on('batch:processing', (data: BatchProcessingData) => {
      this.emit('batch:processing', data);
    });

    this.socket.on('batch:completed', (data: any) => {
      this.emit('batch:completed', data);
    });

    // Analysis events
    this.socket.on('analysis:started', (data: any) => {
      this.emit('analysis:started', data);
    });

    this.socket.on('analysis:completed', (data: any) => {
      this.emit('analysis:completed', data);
    });

    this.socket.on('analysis:stored', (data: any) => {
      this.emit('analysis:stored', data);
    });

    this.socket.on('analysis:skipped', (data: any) => {
      this.emit('analysis:skipped', data);
    });

    this.socket.on('analysis:failed', (data: any) => {
      this.emit('analysis:failed', data);
    });

    this.socket.on('analysis:progress', (data: any) => {
      this.emit('analysis:progress', data);
    });

    // System events
    this.socket.on('system:metrics', (data: SystemMetricsData) => {
      this.emit('system:metrics', data);
    });

    this.socket.on('system:error', (data: any) => {
      this.emit('system:error', data);
    });

    this.socket.on('system:notification', (data: any) => {
      this.emit('system:notification', data);
    });
  }

  // Subscribe to a specific session's events
  public subscribeToSession(sessionId: string) {
    if (!this.socket || !sessionId) return;
    
    this.socket.emit('subscribe:session', sessionId);
    this.subscribedSessions.add(sessionId);
  }

  // Unsubscribe from a session's events
  public unsubscribeFromSession(sessionId: string) {
    if (!this.socket || !sessionId) return;
    
    this.socket.emit('unsubscribe:session', sessionId);
    this.subscribedSessions.delete(sessionId);
  }

  // Subscribe to system-wide events
  public subscribeToSystem() {
    if (!this.socket) return;
    this.socket.emit('subscribe:system');
  }

  // Add event listener
  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  // Remove event listener
  public off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // Emit event to local listeners
  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Send event to server
  public send(event: string, data: any) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit(event, data);
  }

  // Get connection status
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Disconnect socket
  public disconnect() {
    if (this.socket) {
      this.subscribedSessions.clear();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Reconnect socket
  public reconnect() {
    this.disconnect();
    this.connect();
  }
}

// Create singleton instance
const socketService = new SocketService();

// Export singleton
export default socketService;