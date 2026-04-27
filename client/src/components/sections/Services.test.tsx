import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Services } from './Services';
import { ServiceCard } from './ServiceCard';
import type { Service } from '../../types';

const mockServices: Service[] = [
  {
    id: '1',
    title: 'Impresión 3D',
    description: 'Servicio de impresión 3D personalizada para tus proyectos.',
    icon: '🖨️',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Consultoría 3D',
    description: 'Asesoramiento experto en tecnologías de impresión 3D.',
    icon: '💡',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

describe('Services', () => {
  it('renders the "Servicios Personalizados" heading', () => {
    render(<Services services={[]} />);
    expect(
      screen.getByRole('heading', { name: 'Servicios Personalizados' })
    ).toBeInTheDocument();
  });

  it('renders a card for each service', () => {
    render(<Services services={mockServices} />);
    expect(screen.getByText('Impresión 3D')).toBeInTheDocument();
    expect(screen.getByText('Consultoría 3D')).toBeInTheDocument();
  });

  it('renders service descriptions', () => {
    render(<Services services={mockServices} />);
    expect(
      screen.getByText(/impresión 3D personalizada para tus proyectos/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Asesoramiento experto/i)
    ).toBeInTheDocument();
  });

  it('renders service icons', () => {
    render(<Services services={mockServices} />);
    expect(screen.getByText('🖨️')).toBeInTheDocument();
    expect(screen.getByText('💡')).toBeInTheDocument();
  });

  it('shows loading state when loading is true', () => {
    render(<Services services={[]} loading={true} />);
    expect(screen.getByText('Cargando servicios...')).toBeInTheDocument();
  });

  it('does not render cards when loading', () => {
    render(<Services services={mockServices} loading={true} />);
    expect(screen.queryByText('Impresión 3D')).not.toBeInTheDocument();
  });

  it('shows error message when error is provided', () => {
    render(<Services services={[]} error="Servicio no disponible" />);
    expect(screen.getByText('Servicio no disponible')).toBeInTheDocument();
  });

  it('does not render cards when there is an error', () => {
    render(<Services services={mockServices} error="Error" />);
    expect(screen.queryByText('Impresión 3D')).not.toBeInTheDocument();
  });

  it('renders empty grid when services array is empty and no loading/error', () => {
    const { container } = render(<Services services={[]} />);
    const heading = screen.getByRole('heading', { name: 'Servicios Personalizados' });
    expect(heading).toBeInTheDocument();
    // Grid should exist but be empty
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });
});

describe('ServiceCard', () => {
  const service = mockServices[0];

  it('renders the service title', () => {
    render(<ServiceCard service={service} />);
    expect(screen.getByText('Impresión 3D')).toBeInTheDocument();
  });

  it('renders the service description', () => {
    render(<ServiceCard service={service} />);
    expect(
      screen.getByText(/impresión 3D personalizada para tus proyectos/i)
    ).toBeInTheDocument();
  });

  it('renders the service icon with accessible label', () => {
    render(<ServiceCard service={service} />);
    expect(screen.getByRole('img', { name: /Impresión 3D icon/i })).toBeInTheDocument();
  });

  it('renders title as h3', () => {
    render(<ServiceCard service={service} />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Impresión 3D');
  });
});
