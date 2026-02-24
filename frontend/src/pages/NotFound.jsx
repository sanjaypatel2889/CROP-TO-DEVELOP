import { Link, useRouteError } from 'react-router-dom'
import { Home, AlertTriangle } from 'lucide-react'

export default function NotFound() {
  let error = null
  try {
    error = useRouteError()
  } catch {}

  // Check if this is an actual route error vs a 404
  const is404 = !error || error?.status === 404
  const errorMessage = error?.message || error?.statusText || error?.data || ''

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      <div className="max-w-md w-full text-center bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl p-8">
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="p-4 rounded-full bg-orange-100">
            <AlertTriangle className="w-10 h-10 text-orange-500" />
          </div>

          <div>
            <h1 className="text-7xl sm:text-8xl font-extrabold tracking-tight text-gray-900">
              {is404 ? '404' : 'Error'}
            </h1>
            <p className="text-xl mt-2 font-medium text-gray-700">
              {is404 ? 'Page not found' : 'Something went wrong'}
            </p>
            {errorMessage && (
              <p className="text-sm mt-3 text-red-600 bg-red-50 rounded-lg p-3 text-left font-mono break-all">
                {String(errorMessage)}
              </p>
            )}
            {!errorMessage && (
              <p className="text-sm mt-2 text-gray-500">
                The page you are looking for does not exist or has been moved.
              </p>
            )}
          </div>

          <Link to="/">
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-all">
              <Home className="w-4 h-4" />
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
