import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClassicMode } from './ClassicMode';

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
  }),
}));

describe('ClassicMode', () => {
  const onModeSwitch = vi.fn();

  beforeEach(() => {
    onModeSwitch.mockClear();
  });

  it('renders the classic mode container', () => {
    render(<ClassicMode onModeSwitch={onModeSwitch} />);
    expect(screen.getByTestId('classic-mode')).toBeInTheDocument();
  });

  it('renders the navigation bar with brand', () => {
    render(<ClassicMode onModeSwitch={onModeSwitch} />);
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
    expect(screen.getAllByText(/3DRioja/)[0]).toBeInTheDocument();
  });

  it('renders navigation links for all sections', () => {
    render(<ClassicMode onModeSwitch={onModeSwitch} />);
    const menubar = screen.getByRole('menubar');
    const items = menubar.querySelectorAll('[role="menuitem"]');
    const labels = Array.from(items).map((item) => item.textContent);
    expect(labels).toContain('Portfolio');
    expect(labels).toContain('Servicios');
    expect(labels).toContain('Sobre Nosotros');
    expect(labels).toContain('Contacto');
    expect(labels).toContain('Testimonios');
  });

  it('renders Modo Escritorio button', () => {
    render(<ClassicMode onModeSwitch={onModeSwitch} />);
    expect(screen.getByText('Modo Escritorio')).toBeInTheDocument();
  });

  it('calls onModeSwitch when clicking Modo Escritorio button', () => {
    render(<ClassicMode onModeSwitch={onModeSwitch} />);
    fireEvent.click(screen.getByText('Modo Escritorio'));
    expect(onModeSwitch).toHaveBeenCalledTimes(1);
  });

  it('renders all sections with id anchors', () => {
    const { container } = render(<ClassicMode onModeSwitch={onModeSwitch} />);
    expect(container.querySelector('#portfolio')).toBeInTheDocument();
    expect(container.querySelector('#servicios')).toBeInTheDocument();
    expect(container.querySelector('#sobre-nosotros')).toBeInTheDocument();
    expect(container.querySelector('#contacto')).toBeInTheDocument();
    expect(container.querySelector('#testimonios')).toBeInTheDocument();
  });

  it('renders actual section components instead of placeholder text', () => {
    render(<ClassicMode onModeSwitch={onModeSwitch} />);
    // Portfolio section heading
    expect(screen.getByText('Nuestro Portfolio')).toBeInTheDocument();
    // Services section heading
    expect(screen.getByText('Servicios Personalizados')).toBeInTheDocument();
    // About section heading
    expect(screen.getByText('Impresión 3D Personalizada')).toBeInTheDocument();
    // Contact section renders email link (unique to the Contact component)
    expect(screen.getByText('3drioja@gmail.com')).toBeInTheDocument();
    // Testimonials section renders Google Maps link (unique to the Testimonials component)
    expect(screen.getByText('Ver todas las reseñas en Google Maps')).toBeInTheDocument();
  });

  it('renders Hero section at the top', () => {
    const { container } = render(<ClassicMode onModeSwitch={onModeSwitch} />);
    expect(container.querySelector('#hero')).toBeInTheDocument();
    expect(screen.getByText('Impresión 3D Personalizada para Todos')).toBeInTheDocument();
  });

  it('renders Footer section at the bottom', () => {
    const { container } = render(<ClassicMode onModeSwitch={onModeSwitch} />);
    expect(container.querySelector('#footer')).toBeInTheDocument();
    expect(screen.getByText('© 2025. All rights reserved.')).toBeInTheDocument();
  });

  it('renders hamburger menu button', () => {
    render(<ClassicMode onModeSwitch={onModeSwitch} />);
    expect(screen.getByLabelText('Abrir menú')).toBeInTheDocument();
  });

  it('toggles mobile menu when clicking hamburger', () => {
    render(<ClassicMode onModeSwitch={onModeSwitch} />);
    const hamburger = screen.getByLabelText('Abrir menú');

    expect(screen.queryByRole('menu', { name: 'Menú móvil' })).not.toBeInTheDocument();

    fireEvent.click(hamburger);
    expect(screen.getByRole('menu', { name: 'Menú móvil' })).toBeInTheDocument();

    fireEvent.click(hamburger);
    expect(screen.queryByRole('menu', { name: 'Menú móvil' })).not.toBeInTheDocument();
  });

  it('mobile menu contains all section links and Modo Escritorio', () => {
    render(<ClassicMode onModeSwitch={onModeSwitch} />);
    fireEvent.click(screen.getByLabelText('Abrir menú'));

    const mobileMenu = screen.getByRole('menu', { name: 'Menú móvil' });
    const items = mobileMenu.querySelectorAll('[role="menuitem"]');
    const labels = Array.from(items).map((item) => item.textContent);

    expect(labels).toContain('Portfolio');
    expect(labels).toContain('Servicios');
    expect(labels).toContain('Sobre Nosotros');
    expect(labels).toContain('Contacto');
    expect(labels).toContain('Testimonios');
    expect(labels).toContain('Modo Escritorio');
  });

  it('clicking Modo Escritorio in mobile menu calls onModeSwitch and closes menu', () => {
    render(<ClassicMode onModeSwitch={onModeSwitch} />);
    fireEvent.click(screen.getByLabelText('Abrir menú'));

    const mobileMenu = screen.getByRole('menu', { name: 'Menú móvil' });
    const items = mobileMenu.querySelectorAll('[role="menuitem"]');
    const modoEscritorioItem = Array.from(items).find(
      (item) => item.textContent === 'Modo Escritorio',
    );
    fireEvent.click(modoEscritorioItem!);

    expect(onModeSwitch).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu', { name: 'Menú móvil' })).not.toBeInTheDocument();
  });

  it('scrolls to section when clicking a nav link', () => {
    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    render(<ClassicMode onModeSwitch={onModeSwitch} />);
    const menubar = screen.getByRole('menubar');
    const portfolioLink = menubar.querySelector('[role="menuitem"]');
    fireEvent.click(portfolioLink!);

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
  });
});
