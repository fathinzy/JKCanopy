import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

// Guards the /system routes. Redirects to the login page when not signed in.
export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand text-canopy">
        Loading...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/system/login" replace state={{ from: location }} />
  }

  return children
}
