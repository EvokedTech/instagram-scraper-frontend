'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SessionForm from '@/components/SessionForm'
import Link from 'next/link'

export default function CreateSessionPage() {
  const router = useRouter()

  const handleSessionCreated = () => {
    // Redirect to sessions list after successful creation
    router.push('/dashboard/sessions')
  }

  return (
    <div className="space-y-6">
      {/* Page header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/sessions"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Sessions
          </Link>
        </div>
      </div>

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Session</h1>
        <p className="mt-1 text-sm text-gray-500">
          Start a new Instagram profile scraping session with custom parameters
        </p>
      </div>

      {/* Session creation form */}
      <div className="max-w-3xl">
        <SessionForm onSessionCreated={handleSessionCreated} />
      </div>
    </div>
  )
}