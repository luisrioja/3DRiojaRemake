import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

let mockIsAuthenticated = false;
let mockIsLoading = false;

vi.mock('../../context/AuthContext', () => ({
  useAuthContext: () => ({
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsLoading,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    Navigate: (props: { to: string; replace?: boolean }) => {
      return <div data-testid="navigate" data-to={props.to} />;
    },
  };
});

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <ProtectedRoute>
        <div data-testid="protected-content">Dashboard Content</div>
      </ProtectedRoute>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsAuthenticated = false;
  mockIsLoading = false;
});

describe('ProtectedRoute', () => {
  it('shows loading indicator while auth is being verified', () => {
    mockIsLoading = true;
    renderProtected();

    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
    expect(screen.getByText('Verificando autenticación...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects to /admin/ when not authenticated', () => {
    mockIsAuthenticated = false;
    renderProtected();

    const nav = screen.getByTestId('navigate');
    expect(nav).toHaveAttribute('data-to', '/admin/');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    mockIsAuthenticated = true;
    renderProtected();

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('does not show loading or redirect when authenticated', () => {
    mockIsAuthenticated = true;
    renderProtected();

    expect(screen.queryByTestId('auth-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('does not render children while loading', () => {
    mockIsLoading = true;
    mockIsAuthenticated = true;
    renderProtected();

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
  });
});
