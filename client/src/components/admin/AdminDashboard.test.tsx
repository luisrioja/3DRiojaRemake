import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboard } from './AdminDashboard';

// Mock AuthContext
const mockLogout = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuthContext: () => ({
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: mockLogout,
  }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock API so PortfolioManager and ServicesManager don't fail
vi.mock('../../services/api', () => ({
  getPortfolio: vi.fn().mockResolvedValue({ success: true, data: [] }),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  getServices: vi.fn().mockResolvedValue({ success: true, data: [] }),
  createService: vi.fn(),
  updateService: vi.fn(),
  deleteService: vi.fn(),
  getNewsletterEmails: vi.fn().mockResolvedValue({ success: true, data: [] }),
  deleteNewsletterEmail: vi.fn(),
  clearNewsletterEmails: vi.fn(),
}));

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <AdminDashboard />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLogout.mockResolvedValue(undefined);
});

describe('AdminDashboard', () => {
  it('renders the Win95 title bar', () => {
    renderDashboard();
    expect(screen.getByText('Panel de Administración — 3DRioja')).toBeInTheDocument();
  });

  it('renders Portfolio and Servicios navigation buttons', () => {
    renderDashboard();
    expect(screen.getByRole('button', { name: /Portfolio/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Servicios/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Newsletter/i })).toBeInTheDocument();
  });

  it('renders the "Cerrar sesión" button', () => {
    renderDashboard();
    expect(screen.getByRole('button', { name: /Cerrar sesión/i })).toBeInTheDocument();
  });

  it('shows Portfolio section by default', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/Proyectos de Portfolio/i)).toBeInTheDocument();
    });
  });

  it('switches to Servicios section when clicking Servicios button', async () => {
    renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: /Servicios/i }));
    await waitFor(() => {
      expect(screen.getByText(/No hay servicios registrados/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Proyectos de Portfolio/i)).not.toBeInTheDocument();
  });

  it('switches back to Portfolio section when clicking Portfolio button', async () => {
    renderDashboard();
    // Go to Servicios first
    fireEvent.click(screen.getByRole('button', { name: /Servicios/i }));
    await waitFor(() => {
      expect(screen.getByText(/No hay servicios registrados/i)).toBeInTheDocument();
    });

    // Go back to Portfolio
    fireEvent.click(screen.getByRole('button', { name: /Portfolio/i }));
    await waitFor(() => {
      expect(screen.getByText(/Proyectos de Portfolio/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/No hay servicios registrados/i)).not.toBeInTheDocument();
  });

  it('calls logout and navigates to /admin/ when clicking "Cerrar sesión"', async () => {
    renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: /Cerrar sesión/i }));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/');
    });
  });

  it('switches to Newsletter section when clicking Newsletter button', async () => {
    renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: /Newsletter/i }));
    await waitFor(() => {
      expect(screen.getByText(/Suscriptores Newsletter/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Proyectos de Portfolio/i)).not.toBeInTheDocument();
  });
});
