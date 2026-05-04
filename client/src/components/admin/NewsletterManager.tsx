import React, { useEffect, useState, useCallback } from 'react';
import { Panel95 } from '../win95/Panel95';
import { Button95 } from '../win95/Button95';
import { getNewsletterEmails, deleteNewsletterEmail, clearNewsletterEmails } from '../../services/api';
import { Modal95 } from '../win95/Modal95';
import type { NewsletterEmail } from '../../types';
import styles from './PortfolioManager.module.css'; // Reusing styles for consistency

export const NewsletterManager: React.FC = () => {
  const [emails, setEmails] = useState<NewsletterEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getNewsletterEmails();
    if (res.success && res.data) {
      setEmails(res.data);
    } else {
      setError(res.error ?? 'Error al cargar emails');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleDelete = (id: string) => {
    setModalConfig({
      title: 'Eliminar Suscriptor',
      message: '¿Estás seguro de que quieres eliminar este email de la lista?',
      onConfirm: async () => {
        const res = await deleteNewsletterEmail(id);
        if (res.success) {
          await fetchEmails();
        } else {
          alert(res.error ?? 'Error al eliminar');
        }
        setModalOpen(false);
      }
    });
    setModalOpen(true);
  };

  const handleClearAll = () => {
    setModalConfig({
      title: 'Vaciar Lista',
      message: '¿ESTÁS SEGURO? Esta acción borrará TODOS los emails de la lista de forma permanente.',
      onConfirm: async () => {
        const res = await clearNewsletterEmails();
        if (res.success) {
          await fetchEmails();
        } else {
          alert(res.error ?? 'Error al vaciar la lista');
        }
        setModalOpen(false);
      }
    });
    setModalOpen(true);
  };

  if (loading) {
    return (
      <Panel95 variant="sunken" className={styles.loading}>
        <span>Cargando lista de suscripción...</span>
      </Panel95>
    );
  }

  return (
    <div className={styles.container}>
      {error && (
        <Panel95 variant="sunken" className={styles.error}>
          <span>{error}</span>
        </Panel95>
      )}

      <div className={styles.header}>
        <span className={styles.title}>📧 Suscriptores Newsletter</span>
        <Button95 size="sm" onClick={handleClearAll} variant="default">
          🗑️ Vaciar Lista
        </Button95>
      </div>

      {emails.length === 0 ? (
        <Panel95 variant="sunken" className={styles.empty}>
          <span>No hay suscriptores registrados</span>
        </Panel95>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Fecha Suscripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {emails.map(e => (
              <tr key={e.id}>
                <td>{e.email}</td>
                <td>{new Date(e.subscribedAt).toLocaleString()}</td>
                <td>
                  <div className={styles.actions}>
                    <Button95 size="sm" onClick={() => handleDelete(e.id)}>🗑️ Borrar</Button95>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal95
        isOpen={modalOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};

export default NewsletterManager;
