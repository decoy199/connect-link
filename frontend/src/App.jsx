// src/App.jsx
import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom' // ⬅️ no BrowserRouter

import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import PointsRewards from './pages/PointsRewards'
import FAQ from './pages/FAQ'
import QuestionDetail from './pages/QuestionDetail'
import Search from './pages/Search'
import PetLobby from './pages/DepartmentPets'
import Pokemon from './pages/Pokemon'

import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ForgotUsername from './pages/ForgotUsername'

import api from './api'
import { isAuthed } from './auth'

export default function App() {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (isAuthed()) {
      api.get('/me').then(r => setProfile(r.data)).catch(() => {})
    } else {
      setProfile(null)
    }
  }, [])

  return (
    <>
      <Navbar profile={profile} />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Account recovery */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-username" element={<ForgotUsername />} />

        {/* Auth-protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/points" element={<ProtectedRoute><PointsRewards /></ProtectedRoute>} />
        <Route path="/pets" element={<Navigate to="/pet-lobby" replace />} />
        <Route path="/pet-lobby" element={<ProtectedRoute><PetLobby /></ProtectedRoute>} />
        <Route path="/pokemon" element={<ProtectedRoute><Pokemon /></ProtectedRoute>} />
        <Route path="/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />
        <Route path="/questions/:id" element={<ProtectedRoute><QuestionDetail /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}
