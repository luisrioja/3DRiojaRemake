import React, { useEffect, useState, useCallback } from 'react';
import { Panel95 } from '../win95/Panel95';
import { Button95 } from '../win95/Button95';
import { getServices, createService, updateService, deleteService } from '../../services/api';
import type { Service } from '../../types';
import styles from './PortfolioManager.module.css';

interface FormData {
  title: string;
  description: string;
  icon: string;
}

const emptyForm: FormData = { title: '', description: '', icon: '' };

export const ServicesManager: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getServices();
    if (res.success && res.data) {
      setServices(res.data);
    } else {
      setError(res.error ?? 'Error al cargar servicios');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const openNewForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (service: Service) => {
    setEditingId(service.id);
    setForm({ title: service.title, description: service.description, icon: service.icon });
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
      const res = await updateService(editingId, form);
      if (!res.success) {
        setError(res.error ?? 'Error al actualizar servicio');
        return;
      }
    } else {
      const res = await createService(form);
      if (!res.success) {
        setError(res.error ?? 'Error al crear servicio');
        return;
      }
    }

    closeForm();
    await fetchServices();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) return;
    setError(null);
    const res = await deleteService(id);
    if (!res.success) {
      setError(res.error ?? 'Error al eliminar servicio');
      return;
    }
    await fetchServices();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (loading) {
    return (
      <Panel95 variant="sunken" className={styles.loading}>
        <span>Cargando servicios...</span>
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
        <span className={styles.title}>🔧 Servicios</span>
        <Button95 size="sm" onClick={openNewForm}>➕ Nuevo Servicio</Button95>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <span className={styles.formTitle}>
            {editingId ? '✏️ Editar Servicio' : '➕ Nuevo Servicio'}
          </span>
          <div className={styles.field}>
            <label htmlFor="sm-title">Título</label>
            <input id="sm-title" name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="sm-description">Descripción</label>
            <textarea id="sm-description" name="description" value={form.description} onChange={handleChange} required rows={3} />
          </div>
          <div className={styles.field}>
            <label htmlFor="sm-icon">Icono</label>
            <select 
              id="sm-icon" 
              name="icon" 
              value={form.icon || 'wrench'} 
              onChange={(e) => setForm(prev => ({ ...prev, icon: e.target.value }))}
            >
              <option value="wrench">Llave Inglesa (wrench)</option>
              <option value="folder">Carpeta (folder)</option>
              <option value="star">Estrella (star)</option>
              <option value="info">Información (info)</option>
              <option value="mail">Correo (mail)</option>
              <option value="refresh">Recargar (refresh)</option>
            </select>
          </div>
          <div className={styles.formButtons}>
            <Button95 type="submit" size="sm">💾 Guardar</Button95>
            <Button95 size="sm" onClick={closeForm}>❌ Cancelar</Button95>
          </div>
        </form>
      )}

      {services.length === 0 ? (
        <Panel95 variant="sunken" className={styles.empty}>
          <span>No hay servicios registrados</span>
        </Panel95>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Título</th>
              <th>Descripción</th>
              <th>Icono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {services.map(s => (
              <tr key={s.id}>
                <td>{s.title}</td>
                <td>{s.description}</td>
                <td>{s.icon}</td>
                <td>
                  <div className={styles.actions}>
                    <Button95 size="sm" onClick={() => openEditForm(s)}>✏️ Editar</Button95>
                    <Button95 size="sm" onClick={() => handleDelete(s.id)}>🗑️ Eliminar</Button95>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ServicesManager;
