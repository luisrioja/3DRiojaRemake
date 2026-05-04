import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Hero } from './Hero';

describe('Hero', () => {
  it('renders the title "Impresión 3D Personalizada para Todos"', () => {
    render(<Hero />);
    expect(
      screen.getByRole('heading', { name: 'Impresión 3D Personalizada para Todos' })
    ).toBeInTheDocument();
  });

  it('renders the 3DRioja logo', () => {
    render(<Hero />);
    expect(screen.getByAltText('3DRioja')).toBeInTheDocument();
    expect(screen.getByText(/3DRioja/)).toBeInTheDocument();
  });

  it('renders "Ver" CTA button', () => {
    render(<Hero />);
    expect(screen.getByRole('button', { name: 'Ver' })).toBeInTheDocument();
  });

  it('renders "Contáctanos" CTA button', () => {
    render(<Hero />);
    expect(screen.getByRole('button', { name: 'Contáctanos' })).toBeInTheDocument();
  });

  it('calls onNavigate with "portfolio" when "Ver" is clicked', () => {
    const handleNavigate = vi.fn();
    render(<Hero onNavigate={handleNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver' }));
    expect(handleNavigate).toHaveBeenCalledWith('portfolio');
  });

  it('calls onNavigate with "contacto" when "Contáctanos" is clicked', () => {
    const handleNavigate = vi.fn();
    render(<Hero onNavigate={handleNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Contáctanos' }));
    expect(handleNavigate).toHaveBeenCalledWith('contacto');
  });

  it('does not throw when buttons are clicked without onNavigate', () => {
    render(<Hero />);
    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Ver' }));
      fireEvent.click(screen.getByRole('button', { name: 'Contáctanos' }));
    }).not.toThrow();
  });

  it('renders the title as an h1 element', () => {
    render(<Hero />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Impresión 3D Personalizada para Todos');
  });
});
