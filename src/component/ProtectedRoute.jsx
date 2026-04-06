import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store'

// Blocks unauthenticated access to protected pages
export default function ProtectedRoute({ children, requiredRole }) {
  const { user, role } = useAuthStore()

  if (!user) return <Navigate to="/signin" replace />

  const normalizedRole = role === 'agrodealer' ? 'dealer' : role
  if (requiredRole && normalizedRole !== requiredRole) return <Navigate to="/signin" replace />

  // Unverified dealer cannot access dashboard — stays on pending
  if (normalizedRole === 'dealer' && user.is_verified === false) {
    return <Navigate to="/dealer-pending" replace />
  }

  return children
}

// Blocks already-authenticated users from revisiting auth pages (/, /signin, /role, etc.)
export function AuthRoute({ children }) {
  const { user, role } = useAuthStore()

  if (user) {
    const normalizedRole = role === 'agrodealer' ? 'dealer' : role
    // Unverified dealer: allow them through auth pages so they aren't trapped
    if (normalizedRole === 'dealer' && user.is_verified === false) {
      return children
    }
    // Verified users redirect to their dashboard
    return <Navigate to={normalizedRole === 'dealer' ? '/dealer' : '/dashboard'} replace />
  }

  return children
}