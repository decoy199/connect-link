
import { jwtDecode } from 'jwt-decode'


export function saveToken(token){ 
  localStorage.setItem('token', token.access) 
  if (token.refresh) {
    localStorage.setItem('refresh_token', token.refresh)
  }
}

export function getToken(){ 
  return localStorage.getItem('token') 
}

export function getRefreshToken(){ 
  return localStorage.getItem('refresh_token') 
}

export function clearToken(){ 
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
}

export function isAuthed(){
  const t = getToken(); 
  if(!t) return false;
  try{ 
    const d = jwtDecode(t); 
    return d.exp*1000 > Date.now() 
  } catch { 
    clearToken()
    return false 
  }
}

export function logout(){ 
  clearToken()
  window.location.href = '/login'
}
