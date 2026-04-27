import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AdminLogin } from './AdminLogin';

// Mock AuthContext
const mockLogin = vi.fn();
const mockLogout = vi.fn();
let mockIsAuthenticated = false;

vi.mock('../../context/AuthContext', () => ({
  useAuthContext: () => ({
    isAuthenticated: mockIsAuthenticated,
    isLoading: false,
    login: mockLogin,
    logout: mockLogout,
  }),
}));

// Mock Navigate from react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    Navigate: (props: { to: string; replace?: boolean }) => {
      return <div data-testid="navigate" data-to={props.to} />;
    },
  };
});

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AdminLogin />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsAuthenticated = false;
});

describe('AdminLogin', () => {
  it('renders the login form with username and password fields', () => {
    renderLogin();

    expect(screen.getByLabelText('Usuario:')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument();
  });

  it('renders the Win95 title bar', () => {
    renderLogin();

    expect(screen.getByText('Inicio de Sesión — 3DRioja Admin')).toBeInTheDocument();
  });

  it('redirects to /admin/dashboard when already authenticated', () => {
    mockIsAuthenticated = true;
    renderLogin();

    const nav = screen.getByTestId('navigate');
    expect(nav).toHaveAttribute('data-to', '/admin/dashboard');
  });

  it('calls login with username and password on form submit', async () => {
    mockLogin.mockResolvedValue({ success: true });
    renderLogin();

    fireEvent.change(screen.getByLabelText('Usuario:'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Contraseña:'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'secret');
    });
  });

  it('shows "Credenciales incorrectas" on failed login', async () => {
    mockLogin.mockResolvedValue({ success: false, error: 'Credenciales incorrectas' });
    renderLogin();

    fireEvent.change(screen.getByLabelText('Usuario:'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Contraseña:'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Credenciales incorrectas');
    });
  });

  it('shows generic error when login throws', async () => {
    mockLogin.mockRejectedValue(new Error('Network error'));
    renderLogin();

    fireEvent.change(screen.getByLabelText('Usuario:'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Contraseña:'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Credenciales incorrectas');
    });
  });

  it('does not reveal which field is incorrect on error', async () => {
    mockLogin.mockResolvedValue({ success: false, error: 'Credenciales incorrectas' });
    renderLogin();

    fireEvent.change(screen.getByLabelText('Usuario:'), { target: { value: 'wrong' } });
    fireEvent.change(screen.getByLabelText('Contraseña:'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Credenciales incorrectas');
      // Should NOT mention username or password specifically
      expect(alert.textContent).not.toMatch(/usuario/i);
      expect(alert.textContent).not.toMatch(/contraseña/i);
    });
  });

  it('disables submit button while submitting', async () => {
    let resolveLogin!: (value: { success: boolean }) => void;
    mockLogin.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      }),
    );
    renderLogin();

    fireEvent.change(screen.getByLabelText('Usuario:'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Contraseña:'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled();
    });

    // Resolve the login to clean up
    await waitFor(async () => {
      resolveLogin({ success: true });
    });
  });

  it('password field has type="password"', () => {
    renderLogin();

    const passwordInput = screen.getByLabelText('Contraseña:');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
