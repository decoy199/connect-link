import axios from 'axios'
import { getToken, clearToken } from './auth'

const api = axios.create({ 
  baseURL: 'http://localhost:8000/api',
  timeout: 10000, // 10 second timeout
})

// Request interceptor
api.interceptors.request.use((config) => {
  const t = getToken()
  
  const isAuthEndpoint = /^\/(auth\/)?(login|register|forgot-password|reset-password|forgot-username)/.test(config.url || '')

  if (t && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${t}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        clearToken()
        window.location.href = '/login'
        return Promise.reject(new Error('Session expired. Please login again.'))
      }
      
      if (status === 403) {
        return Promise.reject(new Error('You do not have permission to perform this action.'))
      }
      
      if (status === 404) {
        return Promise.reject(new Error('The requested resource was not found.'))
      }
      
      if (status >= 500) {
        return Promise.reject(new Error('Server error. Please try again later.'))
      }
      
      // Return the error message from the server
      const message = data?.detail || data?.message || 'An error occurred'
      return Promise.reject(new Error(message))
    } else if (error.request) {
      // Network error
      return Promise.reject(new Error('Network error. Please check your connection.'))
    } else {
      // Other error
      return Promise.reject(new Error('An unexpected error occurred.'))
    }
  }
)

export default api
