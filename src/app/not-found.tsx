export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 text-center">
      <div className="max-w-md rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
        <p className="text-sm text-gray-500 uppercase tracking-[0.25em] mb-3">Page not found</p>
        <h1 className="text-3xl font-semibold text-gray-900 mb-4">Nothing to see here</h1>
        <p className="text-sm text-gray-600">The page you are looking for does not exist or has been moved.</p>
      </div>
    </div>
  )
}
