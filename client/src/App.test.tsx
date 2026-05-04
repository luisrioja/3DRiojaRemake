import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from './App';

// Mock the API module so AuthProvider doesn't make real network calls
vi.mock('./services/api', () => ({
  verifyAuth: vi.fn().mockResolvedValue({ success: false }),
  login: vi.fn(),
  logout: vi.fn(),
  getServices: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getPortfolio: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getTestimonials: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getAboutSections: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

function renderApp(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders DesktopMode by default on /', () => {
    renderApp('/');
    expect(screen.getByTestId('desktop')).toBeInTheDocument();
  });

  it('renders ClassicMode when mode is classic', () => {
    localStorage.setItem('3drioja-nav-mode', JSON.stringify('classic'));
    renderApp('/');
    expect(screen.getByTestId('classic-mode')).toBeInTheDocument();
  });

  it('renders AdminLogin on /admin/', async () => {
    renderApp('/admin/');
    // AdminLogin shows a loading state initially while AuthProvider verifies, then the login form
    expect(await screen.findByText('Inicio de Sesión — 3DRioja Admin')).toBeInTheDocument();
  });

  it('toggles from desktop to classic mode', () => {
    renderApp('/');
    expect(screen.getByTestId('desktop')).toBeInTheDocument();

    // The StartMenu has a "Modo Clásico" button that calls onModeSwitch
    // In DesktopMode, clicking Start opens the menu
    const startButton = screen.getByText('⊞ Inicio');
    fireEvent.click(startButton);

    const classicButton = screen.getByText('Modo Clásico');
    fireEvent.click(classicButton);

    expect(screen.getByTestId('classic-mode')).toBeInTheDocument();
  });

  it('toggles from classic back to desktop mode', () => {
    localStorage.setItem('3drioja-nav-mode', JSON.stringify('classic'));
    renderApp('/');
    expect(screen.getByTestId('classic-mode')).toBeInTheDocument();

    const desktopButton = screen.getByText('Modo Escritorio');
    fireEvent.click(desktopButton);

    expect(screen.getByTestId('desktop')).toBeInTheDocument();
  });
});
