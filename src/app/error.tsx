'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong!</h2>
      <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 max-w-2xl text-left overflow-auto font-mono text-sm">
        {error.message || 'An unexpected error occurred during rendering.'}
      </div>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
