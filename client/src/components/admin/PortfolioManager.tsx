import React, { useEffect, useState, useCallback } from 'react';
import { Panel95 } from '../win95/Panel95';
import { Button95 } from '../win95/Button95';
import { getPortfolio, createProject, updateProject, deleteProject, uploadPortfolioImage } from '../../services/api';
import { Modal95 } from '../win95/Modal95';
import type { PortfolioProject } from '../../types';
import styles from './PortfolioManager.module.css';

interface FormData {
  title: string;
  description: string;
  image: string;
}

const emptyForm: FormData = { title: '', description: '', image: '' };

export const PortfolioManager: React.FC = () => {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [uploading, setUploading] = useState(false);

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

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getPortfolio();
    if (res.success && res.data) {
      setProjects(res.data);
    } else {
      setError(res.error ?? 'Error al cargar proyectos');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const openNewForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (project: PortfolioProject) => {
    setEditingId(project.id);
    setForm({ title: project.title, description: project.description, image: project.image });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (editingId) {
      const res = await updateProject(editingId, form);
      if (!res.success) {
        setError(res.error ?? 'Error al actualizar proyecto');
        return;
      }
    } else {
      const res = await createProject(form);
      if (!res.success) {
        setError(res.error ?? 'Error al crear proyecto');
        return;
      }
    }

    closeForm();
    await fetchProjects();
  };

  const handleDelete = (id: string) => {
    setModalConfig({
      title: 'Eliminar Proyecto',
      message: '¿Estás seguro de que deseas eliminar este proyecto?',
      onConfirm: async () => {
        setError(null);
        const res = await deleteProject(id);
        if (!res.success) {
          setError(res.error ?? 'Error al eliminar proyecto');
        } else {
          await fetchProjects();
        }
        setModalOpen(false);
      }
    });
    setModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const res = await uploadPortfolioImage(file);
    if (res.success && res.data) {
      setForm(prev => ({ ...prev, image: res.data!.url }));
    } else {
      setError(res.error ?? 'Error al subir la imagen');
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <Panel95 variant="sunken" className={styles.loading}>
        <span>Cargando proyectos...</span>
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
        <span className={styles.title}>📁 Proyectos de Portfolio</span>
        <Button95 size="sm" onClick={openNewForm}>➕ Nuevo Proyecto</Button95>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <span className={styles.formTitle}>
            {editingId ? '✏️ Editar Proyecto' : '➕ Nuevo Proyecto'}
          </span>
          <div className={styles.field}>
            <label htmlFor="pm-title">Título</label>
            <input id="pm-title" name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-description">Descripción</label>
            <textarea id="pm-description" name="description" value={form.description} onChange={handleChange} required rows={3} />
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-image">Imagen (URL o subir archivo)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input id="pm-image" name="image" value={form.image} onChange={handleChange} required style={{ flex: 1 }} />
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <Button95 size="sm" type="button" disabled={uploading}>
                  {uploading ? '⌛...' : '📁 Subir'}
                </Button95>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                  }}
                  accept="image/*"
                  disabled={uploading}
                />
              </div>
            </div>
            {form.image && (
              <div style={{ marginTop: '8px' }}>
                <img src={form.image} alt="Preview" style={{ maxWidth: '100px', height: 'auto', border: '1px solid #000' }} />
              </div>
            )}
          </div>
          <div className={styles.formButtons}>
            <Button95 type="submit" size="sm">💾 Guardar</Button95>
            <Button95 size="sm" onClick={closeForm}>❌ Cancelar</Button95>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <Panel95 variant="sunken" className={styles.empty}>
          <span>No hay proyectos en el portfolio</span>
        </Panel95>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Título</th>
              <th>Descripción</th>
              <th>Imagen</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.description}</td>
                <td>{p.image}</td>
                <td>
                  <div className={styles.actions}>
                    <Button95 size="sm" onClick={() => openEditForm(p)}>✏️ Editar</Button95>
                    <Button95 size="sm" onClick={() => handleDelete(p.id)}>🗑️ Eliminar</Button95>
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

export default PortfolioManager;
