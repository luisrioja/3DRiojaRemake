import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Portfolio } from './Portfolio';
import { PortfolioItem } from './PortfolioItem';
import type { PortfolioProject } from '../../types';

const mockProjects: PortfolioProject[] = [
  {
    id: '1',
    title: 'Prototipo Industrial',
    description: 'Prototipo funcional para línea de producción automatizada.',
    image: '/images/portfolio/proto1.jpg',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Figura Decorativa',
    description: 'Figura personalizada impresa en resina de alta resolución.',
    image: '/images/portfolio/fig1.jpg',
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2025-01-15T00:00:00.000Z',
  },
];

describe('Portfolio', () => {
  it('renders the "Nuestro Portfolio" heading', () => {
    render(<Portfolio projects={[]} />);
    expect(
      screen.getByRole('heading', { name: 'Nuestro Portfolio' })
    ).toBeInTheDocument();
  });

  it('renders a card for each project', () => {
    render(<Portfolio projects={mockProjects} />);
    expect(screen.getByText('Prototipo Industrial')).toBeInTheDocument();
    expect(screen.getByText('Figura Decorativa')).toBeInTheDocument();
  });

  it('renders project images with alt text', () => {
    render(<Portfolio projects={mockProjects} />);
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('alt', 'Prototipo Industrial');
    expect(images[1]).toHaveAttribute('alt', 'Figura Decorativa');
  });

  it('renders project descriptions', () => {
    render(<Portfolio projects={mockProjects} />);
    expect(screen.getByText(/Prototipo funcional/)).toBeInTheDocument();
    expect(screen.getByText(/Figura personalizada/)).toBeInTheDocument();
  });

  it('shows loading state when loading is true', () => {
    render(<Portfolio projects={[]} loading={true} />);
    expect(screen.getByText('Cargando portfolio...')).toBeInTheDocument();
  });

  it('does not render cards when loading', () => {
    render(<Portfolio projects={mockProjects} loading={true} />);
    expect(screen.queryByText('Prototipo Industrial')).not.toBeInTheDocument();
  });

  it('shows error message when error is provided', () => {
    render(<Portfolio projects={[]} error="Servicio no disponible" />);
    expect(screen.getByText('Servicio no disponible')).toBeInTheDocument();
  });

  it('does not render cards when there is an error', () => {
    render(<Portfolio projects={mockProjects} error="Error" />);
    expect(screen.queryByText('Prototipo Industrial')).not.toBeInTheDocument();
  });

  it('opens detail view when a project is clicked', () => {
    render(<Portfolio projects={mockProjects} />);
    fireEvent.click(screen.getByText('Prototipo Industrial'));
    // Detail dialog should appear
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // Should show larger image and full description
    expect(screen.getByLabelText(/Detalles de Prototipo Industrial/)).toBeInTheDocument();
  });

  it('detail view shows project title, image and description', () => {
    render(<Portfolio projects={mockProjects} />);
    fireEvent.click(screen.getByText('Prototipo Industrial'));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // Both card and detail images should be present
    const images = screen.getAllByRole('img', { name: 'Prototipo Industrial' });
    expect(images.length).toBeGreaterThanOrEqual(2); // card + detail
  });

  it('closes detail view when close button is clicked', () => {
    render(<Portfolio projects={mockProjects} />);
    fireEvent.click(screen.getByText('Prototipo Industrial'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Click close button
    fireEvent.click(screen.getByText('✕'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes detail view when overlay background is clicked', () => {
    render(<Portfolio projects={mockProjects} />);
    fireEvent.click(screen.getByText('Prototipo Industrial'));
    const overlay = screen.getByRole('dialog');
    expect(overlay).toBeInTheDocument();
    // Click the overlay itself (not a child)
    fireEvent.click(overlay);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders empty grid when projects array is empty', () => {
    const { container } = render(<Portfolio projects={[]} />);
    expect(
      screen.getByRole('heading', { name: 'Nuestro Portfolio' })
    ).toBeInTheDocument();
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });
});

describe('PortfolioItem', () => {
  const project = mockProjects[0];

  it('renders the project title', () => {
    render(<PortfolioItem project={project} />);
    expect(screen.getByText('Prototipo Industrial')).toBeInTheDocument();
  });

  it('renders the project description', () => {
    render(<PortfolioItem project={project} />);
    expect(screen.getByText(/Prototipo funcional/)).toBeInTheDocument();
  });

  it('renders the project image with alt text', () => {
    render(<PortfolioItem project={project} />);
    const img = screen.getByRole('img', { name: 'Prototipo Industrial' });
    expect(img).toHaveAttribute('src', '/images/portfolio/proto1.jpg');
  });

  it('renders title as h3', () => {
    render(<PortfolioItem project={project} />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Prototipo Industrial');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<PortfolioItem project={project} onClick={handleClick} />);
    fireEvent.click(screen.getByText('Prototipo Industrial'));
    expect(handleClick).toHaveBeenCalledWith(project);
  });

  it('has accessible button role', () => {
    render(<PortfolioItem project={project} />);
    expect(
      screen.getByRole('button', { name: /Ver detalles de Prototipo Industrial/ })
    ).toBeInTheDocument();
  });

  it('triggers onClick on Enter key', () => {
    const handleClick = vi.fn();
    render(<PortfolioItem project={project} onClick={handleClick} />);
    const btn = screen.getByRole('button', { name: /Ver detalles/ });
    fireEvent.keyDown(btn, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledWith(project);
  });
});
