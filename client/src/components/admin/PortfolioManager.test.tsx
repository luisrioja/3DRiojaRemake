import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { PortfolioManager } from './PortfolioManager';

// Mock the API module
vi.mock('../../services/api', () => ({
  getPortfolio: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

import { getPortfolio, createProject, updateProject, deleteProject } from '../../services/api';

const mockProjects = [
  {
    id: '1',
    title: 'Proyecto A',
    description: 'Desc A',
    image: '/img/a.jpg',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Proyecto B',
    description: 'Desc B',
    image: '/img/b.jpg',
    createdAt: '2025-01-02T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPortfolio).mockResolvedValue({ success: true, data: mockProjects });
  vi.mocked(createProject).mockResolvedValue({ success: true, data: mockProjects[0] });
  vi.mocked(updateProject).mockResolvedValue({ success: true, data: mockProjects[0] });
  vi.mocked(deleteProject).mockResolvedValue({ success: true });
});

describe('PortfolioManager', () => {
  it('shows loading state initially', () => {
    // Never resolve so it stays loading
    vi.mocked(getPortfolio).mockReturnValue(new Promise(() => {}));
    render(<PortfolioManager />);
    expect(screen.getByText('Cargando proyectos...')).toBeInTheDocument();
  });

  it('renders project list after loading', async () => {
    render(<PortfolioManager />);
    await waitFor(() => {
      expect(screen.getByText('Proyecto A')).toBeInTheDocument();
    });
    expect(screen.getByText('Proyecto B')).toBeInTheDocument();
  });

  it('shows error when API fails', async () => {
    vi.mocked(getPortfolio).mockResolvedValue({ success: false, error: 'Server error' });
    render(<PortfolioManager />);
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('shows empty state when no projects', async () => {
    vi.mocked(getPortfolio).mockResolvedValue({ success: true, data: [] });
    render(<PortfolioManager />);
    await waitFor(() => {
      expect(screen.getByText('No hay proyectos en el portfolio')).toBeInTheDocument();
    });
  });

  it('opens new project form when clicking "Nuevo Proyecto"', async () => {
    render(<PortfolioManager />);
    await waitFor(() => screen.getByText('Proyecto A'));
    fireEvent.click(screen.getByRole('button', { name: /Nuevo Proyecto/i }));
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
    expect(screen.getByLabelText(/Imagen/i)).toBeInTheDocument();
  });

  it('creates a project and refreshes the list', async () => {
    render(<PortfolioManager />);
    await waitFor(() => screen.getByText('Proyecto A'));

    fireEvent.click(screen.getByRole('button', { name: /Nuevo Proyecto/i }));
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Nuevo' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Desc nueva' } });
    fireEvent.change(screen.getByLabelText(/Imagen/i), { target: { value: '/img/new.jpg' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(createProject).toHaveBeenCalledWith({
        title: 'Nuevo',
        description: 'Desc nueva',
        image: '/img/new.jpg',
      });
    });
    // Refreshes list after create
    await waitFor(() => {
      expect(getPortfolio).toHaveBeenCalledTimes(2);
    });
  });

  it('opens edit form pre-filled with project data', async () => {
    render(<PortfolioManager />);
    await waitFor(() => screen.getByText('Proyecto A'));

    const editButtons = screen.getAllByRole('button', { name: /Editar/i });
    fireEvent.click(editButtons[0]);

    expect(screen.getByLabelText('Título')).toHaveValue('Proyecto A');
    expect(screen.getByLabelText('Descripción')).toHaveValue('Desc A');
    expect(screen.getByLabelText(/Imagen/i)).toHaveValue('/img/a.jpg');
  });

  it('updates a project and refreshes the list', async () => {
    render(<PortfolioManager />);
    await waitFor(() => screen.getByText('Proyecto A'));

    const editButtons = screen.getAllByRole('button', { name: /Editar/i });
    fireEvent.click(editButtons[0]);

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Editado' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(updateProject).toHaveBeenCalledWith('1', {
        title: 'Editado',
        description: 'Desc A',
        image: '/img/a.jpg',
      });
    });
    await waitFor(() => {
      expect(getPortfolio).toHaveBeenCalledTimes(2);
    });
  });

  it('deletes a project with confirmation and refreshes', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<PortfolioManager />);
    await waitFor(() => screen.getByText('Proyecto A'));

    const deleteButtons = screen.getAllByRole('button', { name: /Eliminar/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteProject).toHaveBeenCalledWith('1');
    });
    await waitFor(() => {
      expect(getPortfolio).toHaveBeenCalledTimes(2);
    });
  });

  it('does not delete when confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<PortfolioManager />);
    await waitFor(() => screen.getByText('Proyecto A'));

    const deleteButtons = screen.getAllByRole('button', { name: /Eliminar/i });
    fireEvent.click(deleteButtons[0]);

    expect(deleteProject).not.toHaveBeenCalled();
  });

  it('closes form when clicking cancel', async () => {
    render(<PortfolioManager />);
    await waitFor(() => screen.getByText('Proyecto A'));

    fireEvent.click(screen.getByRole('button', { name: /Nuevo Proyecto/i }));
    expect(screen.getByLabelText('Título')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
  });

  it('shows error when create fails', async () => {
    vi.mocked(createProject).mockResolvedValue({ success: false, error: 'Fallo al crear' });
    render(<PortfolioManager />);
    await waitFor(() => screen.getByText('Proyecto A'));

    fireEvent.click(screen.getByRole('button', { name: /Nuevo Proyecto/i }));
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Y' } });
    fireEvent.change(screen.getByLabelText(/Imagen/i), { target: { value: 'Z' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(screen.getByText('Fallo al crear')).toBeInTheDocument();
    });
  });
});
