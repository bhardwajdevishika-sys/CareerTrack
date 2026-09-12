import { createContext, useEffect, useState } from 'react'
import * as authService from '../services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('CareerTrack_token')

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await authService.getCurrentUser()
        setUser(response.user)
      } catch {
        localStorage.removeItem('CareerTrack_token')
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  const startSession = ({ token, user: authenticatedUser }) => {
    localStorage.setItem('CareerTrack_token', token)
    setUser(authenticatedUser)
  }

  const endSession = async () => {
    try {
      await authService.logout()
    } catch {
      // Tokens are stateless; client cleanup still completes logout.
    } finally {
      localStorage.removeItem('CareerTrack_token')
      setUser(null)
    }
  }

  const saveProfile = async (data) => {
    const response = await authService.updateProfile(data)
    setUser(response.user)
    return response
  }

  return (
    <AuthContext.Provider value={{ user, loading, startSession, endSession, saveProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
