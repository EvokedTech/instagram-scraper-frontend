import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add response interceptor to handle canceled requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Silently handle canceled requests
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
      return Promise.reject({ ...error, isCanceled: true })
    }
    return Promise.reject(error)
  }
)

// Session APIs
export const sessionAPI = {
  create: async (data: any) => {
    const response = await api.post('/sessions', data)
    return response.data
  },
  
  list: async (params?: any) => {
    const response = await api.get('/sessions', { params })
    return response.data
  },
  
  get: async (id: string) => {
    const response = await api.get(`/sessions/${id}`)
    return response.data
  },
  
  pause: async (id: string) => {
    const response = await api.put(`/sessions/${id}/status`, { status: 'paused' })
    return response.data
  },
  
  resume: async (id: string) => {
    const response = await api.put(`/sessions/${id}/status`, { status: 'running' })
    return response.data
  },
  
  stop: async (id: string) => {
    const response = await api.post(`/sessions/${id}/stop`)
    return response.data
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/sessions/${id}`)
    return response.data
  },
}

// Scraper APIs
export const scraperAPI = {
  startBatch: async (sessionId: string) => {
    const response = await api.post(`/sessions/${sessionId}/queue-process`)
    return response.data
  },
  
  getStatus: async (sessionId: string) => {
    const response = await api.get(`/scraper/status/${sessionId}`)
    return response.data
  },
}

// Queue APIs
export const queueAPI = {
  getStatus: async () => {
    const response = await api.get('/queues/status')
    return response.data
  },
  
  clean: async (queueName: string) => {
    const response = await api.post(`/queues/${queueName}/clean`)
    return response.data
  },
}

// Dashboard APIs
export const dashboardAPI = {
  getSessions: async (params?: any) => {
    const response = await api.get('/dashboard/sessions', { params })
    return response.data
  },
  
  getSessionMonitoring: async (id: string) => {
    const response = await api.get(`/dashboard/session/${id}`)
    return response.data
  },
  
  getSystemAnalytics: async () => {
    const response = await api.get('/dashboard/system')
    return response.data
  },
  
  getSessionProfiles: async (id: string, params?: any) => {
    const response = await api.get(`/dashboard/session/${id}/profiles`, { params })
    return response.data
  },
  
  getDatabaseProfiles: async (params?: any, signal?: AbortSignal) => {
    const response = await api.get('/dashboard/profiles', { 
      params,
      signal 
    })
    return response.data
  },
}

// Health Check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health')
    return response.data
  } catch (error) {
    return { status: 'offline' }
  }
}

// Default export for backward compatibility
export default api;