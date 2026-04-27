import React, { useState, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { Panel95 } from '../win95/Panel95';
import { Button95 } from '../win95/Button95';
import styles from './AdminLogin.module.css';

export const AdminLogin: React.FC = () => {
  const { isAuthenticated, login } = useAuthContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError('Credenciales incorrectas');
      }
    } catch {
      setError('Credenciales incorrectas');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Panel95 variant="raised" className={styles.dialog}>
        <div className={styles.titleBar}>
          <span className={styles.titleIcon}>🔒</span>
          <span>Inicio de Sesión — 3DRioja Admin</span>
        </div>
        <form onSubmit={handleSubmit} className={styles.body}>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>
              Usuario:
            </label>
            <input
              id="username"
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Contraseña:
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className={styles.actions}>
            <Button95 type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Aceptar'}
            </Button95>
          </div>
        </form>
      </Panel95>
    </div>
  );
};

export default AdminLogin;
