// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // BrowserRouter is assumed to wrap <App /> higher up

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import PointsRewards from './pages/PointsRewards';
import FAQ from './pages/FAQ';
import QuestionDetail from './pages/QuestionDetail';
import Search from './pages/Search';
import PetLobby from './pages/DepartmentPets';
import Pokemon from './pages/Pokemon';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ForgotUsername from './pages/ForgotUsername';

import api from './api';
import { isAuthed } from './auth';

export default function App() {
  // Store the logged-in user's profile so Navbar can render name/avatar/etc.
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // On mount, if we have auth, try to fetch /me.
    if (isAuthed()) {
      api
        .get('/me')
        .then((r) => setProfile(r.data))
        .catch(() => {
          // ignore errors, leave profile null
        });
    } else {
      setProfile(null);
    }
  }, []);

  return (
    <>
      <Navbar profile={profile} />

      <Routes>
        {/* Public routes (no auth required) */}
        {/* Root now goes to /dashboard again, NOT /faq */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Account recovery */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-username" element={<ForgotUsername />} />

        {/* Protected pages (require auth) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/points"
          element={
            <ProtectedRoute>
              <PointsRewards />
            </ProtectedRoute>
          }
        />

        {/* /pets keeps backwards compatibility */}
        <Route path="/pets" element={<Navigate to="/pet-lobby" replace />} />

        <Route
          path="/pet-lobby"
          element={
            <ProtectedRoute>
              <PetLobby />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pokemon"
          element={
            <ProtectedRoute>
              <Pokemon />
            </ProtectedRoute>
          }
        />

        {/* FAQ is still protected.
           We navigate here automatically ONLY after signup. */}
        <Route
          path="/faq"
          element={
            <ProtectedRoute>
              <FAQ />
            </ProtectedRoute>
          }
        />

        <Route
          path="/questions/:id"
          element={
            <ProtectedRoute>
              <QuestionDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          }
        />

        {/* Catch-all: send to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
