import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div data-testid="auth-loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#008080', color: '#fff', fontFamily: '"MS Sans Serif", Arial, sans-serif' }}>
        Verificando autenticación...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
