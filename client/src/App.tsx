import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ModeProvider, useModeContext } from './context/ModeContext';
import { AuthProvider } from './context/AuthContext';
import { DesktopMode } from './components/modes/DesktopMode';
import { ClassicMode } from './components/modes/ClassicMode';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProtectedRoute } from './components/admin/ProtectedRoute';

function PublicSite() {
  const { mode, toggleMode } = useModeContext();

  if (mode === 'classic') {
    return <ClassicMode onModeSwitch={toggleMode} />;
  }

  return <DesktopMode onModeSwitch={toggleMode} />;
}

function App() {
  return (
    <ModeProvider>
      <Routes>
        <Route path="/" element={<PublicSite />} />
        <Route
          path="/admin/"
          element={
            <AuthProvider>
              <AdminLogin />
            </AuthProvider>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AuthProvider>
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            </AuthProvider>
          }
        />
      </Routes>
    </ModeProvider>
  );
}

export default App;
