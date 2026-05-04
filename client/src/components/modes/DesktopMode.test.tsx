import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DesktopMode } from './DesktopMode';

// Mock the API data hook so no real fetch calls are made
vi.mock('../../hooks/useApiData', () => ({
  useApiData: () => ({
    services: [],
    servicesLoading: false,
    servicesError: null,
    projects: [],
    projectsLoading: false,
    projectsError: null,
    testimonials: [],
    testimonialsLoading: false,
    testimonialsError: null,
    aboutSections: [
      { id: '1', title: 'Impresión 3D Personalizada', content: '...', order: 1 },
      { id: '2', title: 'Nuestra Misión', content: '...', order: 2 }
    ],
    aboutLoading: false,
    aboutError: null,
  }),
}));

describe('DesktopMode', () => {
  const onModeSwitch = vi.fn();

  beforeEach(() => {
    onModeSwitch.mockClear();
  });

  it('renders the desktop area with teal background', () => {
    render(<DesktopMode onModeSwitch={onModeSwitch} />);
    expect(screen.getByTestId('desktop')).toBeInTheDocument();
  });

  it('renders all 5 desktop icons', () => {
    render(<DesktopMode onModeSwitch={onModeSwitch} />);
    expect(screen.getByLabelText('Portfolio')).toBeInTheDocument();
    expect(screen.getByLabelText('Servicios')).toBeInTheDocument();
    expect(screen.getByLabelText('Sobre Nosotros')).toBeInTheDocument();
    expect(screen.getByLabelText('Contacto')).toBeInTheDocument();
    expect(screen.getByLabelText('Testimonios')).toBeInTheDocument();
  });

  it('renders the taskbar', () => {
    render(<DesktopMode onModeSwitch={onModeSwitch} />);
    expect(screen.getByRole('toolbar', { name: 'Barra de tareas' })).toBeInTheDocument();
  });

  it('opens a window with section content when double-clicking a desktop icon', () => {
    render(<DesktopMode onModeSwitch={onModeSwitch} />);
    const portfolioIcon = screen.getByLabelText('Portfolio');
    fireEvent.doubleClick(portfolioIcon);
    expect(screen.getByTestId('window-portfolio')).toBeInTheDocument();
    // Portfolio section renders its heading
    expect(screen.getByText('Nuestro Portfolio')).toBeInTheDocument();
  });

  it('opens the start menu when clicking the start button', () => {
    render(<DesktopMode onModeSwitch={onModeSwitch} />);
    const startButton = screen.getByText('⊞ Inicio');
    fireEvent.click(startButton);
    expect(screen.getByRole('menu', { name: 'Menú Inicio' })).toBeInTheDocument();
  });

  it('start menu contains all section items', () => {
    render(<DesktopMode onModeSwitch={onModeSwitch} />);
    fireEvent.click(screen.getByText('⊞ Inicio'));
    const menuItems = screen.getAllByRole('menuitem');
    const labels = menuItems.map((item) => item.textContent ?? '');
    expect(labels.some((l) => l.includes('Portfolio'))).toBe(true);
    expect(labels.some((l) => l.includes('Servicios'))).toBe(true);
    expect(labels.some((l) => l.includes('Sobre Nosotros'))).toBe(true);
    expect(labels.some((l) => l.includes('Contacto'))).toBe(true);
    expect(labels.some((l) => l.includes('Testimonios'))).toBe(true);
  });

  it('start menu includes Modo Clásico option', () => {
    render(<DesktopMode onModeSwitch={onModeSwitch} />);
    fireEvent.click(screen.getByText('⊞ Inicio'));
    expect(screen.getByText('Modo Clásico')).toBeInTheDocument();
  });

  it('clicking Modo Clásico in start menu calls onModeSwitch', () => {
    render(<DesktopMode onModeSwitch={onModeSwitch} />);
    fireEvent.click(screen.getByText('⊞ Inicio'));
    fireEvent.click(screen.getByText('Modo Clásico'));
    expect(onModeSwitch).toHaveBeenCalled();
  });

  it('clicking a start menu item opens the corresponding window with section content', () => {
    render(<DesktopMode onModeSwitch={onModeSwitch} />);
    fireEvent.click(screen.getByText('⊞ Inicio'));
    const menuItems = screen.getAllByRole('menuitem');
    const serviciosItem = menuItems.find((item) => item.textContent?.includes('Servicios'));
    fireEvent.click(serviciosItem!);
    expect(screen.getByTestId('window-servicios')).toBeInTheDocument();
    // Services section renders its heading
    expect(screen.getByText('Servicios Personalizados')).toBeInTheDocument();
  });

  it('shows open windows in the taskbar', () => {
    render(<DesktopMode onModeSwitch={onModeSwitch} />);
    fireEvent.doubleClick(screen.getByLabelText('Contacto'));
    const windowList = screen.getByRole('list', { name: 'Ventanas abiertas' });
    expect(windowList).toHaveTextContent('Contacto');
  });

  it('renders About section inside Sobre Nosotros window', () => {
    render(<DesktopMode onModeSwitch={onModeSwitch} />);
    fireEvent.doubleClick(screen.getByLabelText('Sobre Nosotros'));
    expect(screen.getByText('Impresión 3D Personalizada')).toBeInTheDocument();
  });

  it('renders Testimonials section inside Testimonios window', () => {
    render(<DesktopMode onModeSwitch={onModeSwitch} />);
    fireEvent.doubleClick(screen.getByLabelText('Testimonios'));
    // The Testimonials component renders a Google Maps link
    expect(screen.getByText('Ver todas las reseñas en Google Maps')).toBeInTheDocument();
  });
});
