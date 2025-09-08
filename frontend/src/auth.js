
import { jwtDecode } from 'jwt-decode'


export function saveToken(token){ localStorage.setItem('token', token.access) }
export function getToken(){ return localStorage.getItem('token') }
export function isAuthed(){
  const t = getToken(); if(!t) return false;
  try{ const d = jwtDecode(t); return d.exp*1000 > Date.now() } catch { return false }
}
export function logout(){ localStorage.removeItem('token') }
