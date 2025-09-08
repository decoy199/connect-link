import axios from 'axios'
import { getToken } from './auth'

const api = axios.create({ baseURL: 'http://localhost:8000/api' })

api.interceptors.request.use((config) => {
  const t = getToken()
  
  const isAuthEndpoint = /^\/(auth\/)?(login|register|forgot-password|reset-password|forgot-username)/.test(config.url || '')

  if (t && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${t}`
  }
  return config
})

export default api
