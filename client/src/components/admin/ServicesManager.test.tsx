import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ServicesManager } from './ServicesManager';

vi.mock('../../services/api', () => ({
  getServices: vi.fn(),
  createService: vi.fn(),
  updateService: vi.fn(),
  deleteService: vi.fn(),
}));

import { getServices, createService, updateService, deleteService } from '../../services/api';

const mockServices = [
  {
    id: '1',
    title: 'Impresión 3D',
    description: 'Servicio de impresión 3D personalizada',
    icon: 'printer-3d',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Consultoría 3D',
    description: 'Asesoramiento técnico en 3D',
    icon: 'consult',
    createdAt: '2025-01-02T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServices).mockResolvedValue({ success: true, data: mockServices });
  vi.mocked(createService).mockResolvedValue({ success: true, data: mockServices[0] });
  vi.mocked(updateService).mockResolvedValue({ success: true, data: mockServices[0] });
  vi.mocked(deleteService).mockResolvedValue({ success: true });
});

describe('ServicesManager', () => {
  it('shows loading state initially', () => {
    vi.mocked(getServices).mockReturnValue(new Promise(() => {}));
    render(<ServicesManager />);
    expect(screen.getByText('Cargando servicios...')).toBeInTheDocument();
  });

  it('renders service list after loading', async () => {
    render(<ServicesManager />);
    await waitFor(() => {
      expect(screen.getByText('Impresión 3D')).toBeInTheDocument();
    });
    expect(screen.getByText('Consultoría 3D')).toBeInTheDocument();
  });

  it('shows error when API fails', async () => {
    vi.mocked(getServices).mockResolvedValue({ success: false, error: 'Server error' });
    render(<ServicesManager />);
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('shows empty state when no services', async () => {
    vi.mocked(getServices).mockResolvedValue({ success: true, data: [] });
    render(<ServicesManager />);
    await waitFor(() => {
      expect(screen.getByText('No hay servicios registrados')).toBeInTheDocument();
    });
  });

  it('opens new service form when clicking "Nuevo Servicio"', async () => {
    render(<ServicesManager />);
    await waitFor(() => screen.getByText('Impresión 3D'));
    fireEvent.click(screen.getByRole('button', { name: /Nuevo Servicio/i }));
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
    expect(screen.getByLabelText('Icono')).toBeInTheDocument();
  });

  it('creates a service and refreshes the list', async () => {
    render(<ServicesManager />);
    await waitFor(() => screen.getByText('Impresión 3D'));

    fireEvent.click(screen.getByRole('button', { name: /Nuevo Servicio/i }));
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Nuevo' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Desc nueva' } });
    fireEvent.change(screen.getByLabelText('Icono'), { target: { value: 'star' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(createService).toHaveBeenCalledWith({
        title: 'Nuevo',
        description: 'Desc nueva',
        icon: 'star',
      });
    });
    await waitFor(() => {
      expect(getServices).toHaveBeenCalledTimes(2);
    });
  });

  it('opens edit form pre-filled with service data', async () => {
    render(<ServicesManager />);
    await waitFor(() => screen.getByText('Impresión 3D'));

    const editButtons = screen.getAllByRole('button', { name: /Editar/i });
    fireEvent.click(editButtons[0]);

    expect(screen.getByLabelText('Título')).toHaveValue('Impresión 3D');
    expect(screen.getByLabelText('Descripción')).toHaveValue('Servicio de impresión 3D personalizada');
    
    // printer-3d is not a valid option, it falls back to wrench in the select, so expect wrench
    expect(screen.getByLabelText('Icono')).toHaveValue('wrench');
  });

  it('updates a service and refreshes the list', async () => {
    render(<ServicesManager />);
    await waitFor(() => screen.getByText('Impresión 3D'));

    const editButtons = screen.getAllByRole('button', { name: /Editar/i });
    fireEvent.click(editButtons[0]);

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Editado' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(updateService).toHaveBeenCalledWith('1', {
        title: 'Editado',
        description: 'Servicio de impresión 3D personalizada',
        icon: 'printer-3d',
      });
    });
    await waitFor(() => {
      expect(getServices).toHaveBeenCalledTimes(2);
    });
  });

  it('deletes a service with confirmation and refreshes', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<ServicesManager />);
    await waitFor(() => screen.getByText('Impresión 3D'));

    const deleteButtons = screen.getAllByRole('button', { name: /Eliminar/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteService).toHaveBeenCalledWith('1');
    });
    await waitFor(() => {
      expect(getServices).toHaveBeenCalledTimes(2);
    });
  });

  it('does not delete when confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<ServicesManager />);
    await waitFor(() => screen.getByText('Impresión 3D'));

    const deleteButtons = screen.getAllByRole('button', { name: /Eliminar/i });
    fireEvent.click(deleteButtons[0]);

    expect(deleteService).not.toHaveBeenCalled();
  });

  it('closes form when clicking cancel', async () => {
    render(<ServicesManager />);
    await waitFor(() => screen.getByText('Impresión 3D'));

    fireEvent.click(screen.getByRole('button', { name: /Nuevo Servicio/i }));
    expect(screen.getByLabelText('Título')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
  });

  it('shows error when create fails', async () => {
    vi.mocked(createService).mockResolvedValue({ success: false, error: 'Fallo al crear' });
    render(<ServicesManager />);
    await waitFor(() => screen.getByText('Impresión 3D'));

    fireEvent.click(screen.getByRole('button', { name: /Nuevo Servicio/i }));
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Y' } });
    fireEvent.change(screen.getByLabelText('Icono'), { target: { value: 'info' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(screen.getByText('Fallo al crear')).toBeInTheDocument();
    });
  });
});
