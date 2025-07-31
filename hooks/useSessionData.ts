import useSWR from 'swr'
import { dashboardAPI, api } from '@/lib/api'

// SWR fetcher
const fetcher = async (url: string) => {
  const response = await api.get(url)
  return response.data?.data || response.data
}

// Custom hook for session list with pagination
export function useSessionList(page: number = 1, limit: number = 10) {
  const { data: response, error, mutate } = useSWR(
    `/dashboard/sessions?limit=${limit}&offset=${(page - 1) * limit}`,
    async (url: string) => {
      const res = await api.get(url)
      return res.data // Return the full response
    },
    {
      refreshInterval: 10000, // Refresh every 10 seconds
      revalidateOnFocus: true,
      dedupingInterval: 2000, // Dedupe requests within 2 seconds
    }
  )

  // The backend returns { success: true, data: [...sessions...], pagination: { total, limit, offset } }
  return {
    sessions: response?.data || [],  // Extract sessions array from response.data
    totalCount: response?.pagination?.total || 0,  // Extract total from pagination
    isLoading: !error && !response,
    isError: error,
    mutate
  }
}

// Custom hook for single session data
export function useSession(sessionId: string | null) {
  const { data, error, mutate } = useSWR(
    sessionId ? `/dashboard/session/${sessionId}` : null,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds for active monitoring
      revalidateOnFocus: true,
      dedupingInterval: 1000,
    }
  )

  return {
    session: data,
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}

// Custom hook for system metrics
export function useSystemMetrics() {
  const { data, error, mutate } = useSWR(
    '/system/metrics',
    fetcher,
    {
      refreshInterval: 15000, // Refresh every 15 seconds
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  return {
    metrics: data,
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}