import React, { useEffect, useState, useCallback } from 'react';
import { Panel95 } from '../win95/Panel95';
import { Button95 } from '../win95/Button95';
import { getAboutSections, createAboutSection, updateAboutSection, deleteAboutSection } from '../../services/api';
import { Modal95 } from '../win95/Modal95';
import type { AboutSection } from '../../types';
import styles from './PortfolioManager.module.css'; // Reusing styles

interface FormData {
  title: string;
  content: string;
  order: number;
}

const emptyForm: FormData = { title: '', content: '', order: 0 };

export const AboutManager: React.FC = () => {
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

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

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getAboutSections();
    if (res.success && res.data) {
      setSections(res.data);
    } else {
      setError(res.error ?? 'Error al cargar las secciones');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const openNewForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, order: sections.length + 1 });
    setShowForm(true);
  };

  const openEditForm = (section: AboutSection) => {
    setEditingId(section.id);
    setForm({ title: section.title, content: section.content, order: section.order });
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

    const formData = {
      ...form,
      order: Number(form.order)
    };

    if (editingId) {
      const res = await updateAboutSection(editingId, formData);
      if (!res.success) {
        setError(res.error ?? 'Error al actualizar sección');
        return;
      }
    } else {
      const res = await createAboutSection(formData);
      if (!res.success) {
        setError(res.error ?? 'Error al crear sección');
        return;
      }
    }

    closeForm();
    await fetchSections();
  };

  const handleDelete = (id: string) => {
    setModalConfig({
      title: 'Eliminar Sección',
      message: '¿Estás seguro de que deseas eliminar esta sección?',
      onConfirm: async () => {
        setError(null);
        const res = await deleteAboutSection(id);
        if (!res.success) {
          setError(res.error ?? 'Error al eliminar sección');
        } else {
          await fetchSections();
        }
        setModalOpen(false);
      }
    });
    setModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (loading) {
    return (
      <Panel95 variant="sunken" className={styles.loading}>
        <span>Cargando información...</span>
      </Panel95>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Gestión Sobre Nosotros</h3>
        {!showForm && <Button95 onClick={openNewForm}>Nueva Sección</Button95>}
      </div>

      {error && (
        <Panel95 variant="raised" className={styles.errorPanel}>
          <span className={styles.errorMessage}>{error}</span>
          <Button95 onClick={() => setError(null)}>OK</Button95>
        </Panel95>
      )}

      {showForm ? (
        <Panel95 variant="sunken" className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Título:</label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="content">Contenido:</label>
              <textarea
                id="content"
                name="content"
                value={form.content}
                onChange={handleChange}
                required
                rows={5}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="order">Orden:</label>
              <input
                id="order"
                name="order"
                type="number"
                value={form.order}
                onChange={handleChange}
                required
                min="1"
              />
            </div>

            <div className={styles.formActions}>
              <Button95 type="submit">{editingId ? 'Guardar Cambios' : 'Crear'}</Button95>
              <Button95 type="button" onClick={closeForm}>Cancelar</Button95>
            </div>
          </form>
        </Panel95>
      ) : (
        <div className={styles.list}>
          {sections.map(section => (
            <Panel95 key={section.id} variant="raised" className={styles.listItem}>
              <div className={styles.itemInfo}>
                <h4 className={styles.itemTitle}>{section.order}. {section.title}</h4>
                <p className={styles.itemDesc}>{section.content.substring(0, 100)}...</p>
              </div>
              <div className={styles.itemActions}>
                <Button95 onClick={() => openEditForm(section)}>Editar</Button95>
                <Button95 onClick={() => handleDelete(section.id)}>Eliminar</Button95>
              </div>
            </Panel95>
          ))}
          {sections.length === 0 && (
            <div className={styles.empty}>No hay secciones configuradas.</div>
          )}
        </div>
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

export default AboutManager;
