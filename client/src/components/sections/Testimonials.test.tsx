import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Testimonials } from './Testimonials';
import type { Testimonial } from '../../types';

const mockTestimonials: Testimonial[] = [
  {
    id: '1',
    author: 'María García',
    text: 'Excelente servicio de impresión 3D, muy profesionales.',
    rating: 5,
    date: '2025-01-15',
  },
  {
    id: '2',
    author: 'Carlos López',
    text: 'Buena calidad pero tardaron un poco más de lo esperado.',
    rating: 4,
    date: '2025-02-10',
  },
  {
    id: '3',
    author: 'Ana Martínez',
    text: 'Servicio correcto, cumplieron con lo prometido.',
    rating: 3,
    date: '2025-03-05',
  },
];

describe('Testimonials', () => {
  it('renders the "Testimonios" heading', () => {
    render(<Testimonials testimonials={[]} />);
    expect(
      screen.getByRole('heading', { name: 'Testimonios' })
    ).toBeInTheDocument();
  });

  it('renders a card for each testimonial', () => {
    render(<Testimonials testimonials={mockTestimonials} />);
    expect(screen.getByText('María García')).toBeInTheDocument();
    expect(screen.getByText('Carlos López')).toBeInTheDocument();
    expect(screen.getByText('Ana Martínez')).toBeInTheDocument();
  });

  it('renders testimonial text', () => {
    render(<Testimonials testimonials={mockTestimonials} />);
    expect(
      screen.getByText(/Excelente servicio de impresión 3D/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Buena calidad pero tardaron/i)
    ).toBeInTheDocument();
  });

  it('renders star ratings', () => {
    render(<Testimonials testimonials={mockTestimonials} />);
    // 5 stars: ★★★★★
    expect(screen.getByLabelText('5 de 5 estrellas')).toHaveTextContent('★★★★★');
    // 4 stars: ★★★★☆
    expect(screen.getByLabelText('4 de 5 estrellas')).toHaveTextContent('★★★★☆');
    // 3 stars: ★★★☆☆
    expect(screen.getByLabelText('3 de 5 estrellas')).toHaveTextContent('★★★☆☆');
  });

  it('renders testimonial dates', () => {
    render(<Testimonials testimonials={mockTestimonials} />);
    expect(screen.getByText('2025-01-15')).toBeInTheDocument();
    expect(screen.getByText('2025-02-10')).toBeInTheDocument();
  });

  it('renders Google Maps link', () => {
    render(<Testimonials testimonials={mockTestimonials} />);
    const link = screen.getByRole('link', { name: /Ver todas las reseñas en Google Maps/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://maps.app.goo.gl/bZ4gzWByAZX1cp2Y7');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows cached message when isCached is true', () => {
    render(<Testimonials testimonials={mockTestimonials} isCached={true} />);
    expect(
      screen.getByText('Mostrando reseñas almacenadas recientemente')
    ).toBeInTheDocument();
  });

  it('does not show cached message when isCached is false', () => {
    render(<Testimonials testimonials={mockTestimonials} isCached={false} />);
    expect(
      screen.queryByText('Mostrando reseñas almacenadas recientemente')
    ).not.toBeInTheDocument();
  });

  it('shows loading state when loading is true', () => {
    render(<Testimonials testimonials={[]} loading={true} />);
    expect(screen.getByText('Cargando testimonios...')).toBeInTheDocument();
  });

  it('does not render cards when loading', () => {
    render(<Testimonials testimonials={mockTestimonials} loading={true} />);
    expect(screen.queryByText('María García')).not.toBeInTheDocument();
  });

  it('shows error message when error is provided', () => {
    render(<Testimonials testimonials={[]} error="No se pudieron cargar los testimonios" />);
    expect(screen.getByText('No se pudieron cargar los testimonios')).toBeInTheDocument();
  });

  it('does not render cards when there is an error', () => {
    render(<Testimonials testimonials={mockTestimonials} error="Error" />);
    expect(screen.queryByText('María García')).not.toBeInTheDocument();
  });

  it('renders empty grid when testimonials array is empty and no loading/error', () => {
    render(<Testimonials testimonials={[]} />);
    const heading = screen.getByRole('heading', { name: 'Testimonios' });
    expect(heading).toBeInTheDocument();
    // Google Maps link should still be visible
    expect(screen.getByRole('link', { name: /Google Maps/i })).toBeInTheDocument();
  });
});
