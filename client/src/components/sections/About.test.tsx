import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { About } from './About';
import { useApiData } from '../../hooks/useApiData';

vi.mock('../../hooks/useApiData');

describe('About', () => {
  const mockSections = [
    { id: '1', title: 'Impresión 3D Personalizada', content: 'servicio integral de impresión 3D', order: 1 },
    { id: '2', title: 'Nuestra Misión', content: 'innovación accesible', order: 2 }
  ];

  it('renders the "Impresión 3D Personalizada" subsection heading', () => {
    vi.mocked(useApiData).mockReturnValue({ aboutSections: mockSections, aboutLoading: false, aboutError: null } as any);
    render(<About />);
    expect(
      screen.getByRole('heading', { name: 'Impresión 3D Personalizada' })
    ).toBeInTheDocument();
  });

  it('renders the "Nuestra Misión" subsection heading', () => {
    vi.mocked(useApiData).mockReturnValue({ aboutSections: mockSections, aboutLoading: false, aboutError: null } as any);
    render(<About />);
    expect(
      screen.getByRole('heading', { name: 'Nuestra Misión' })
    ).toBeInTheDocument();
  });

  it('renders a description about custom 3D printing services', () => {
    vi.mocked(useApiData).mockReturnValue({ aboutSections: mockSections, aboutLoading: false, aboutError: null } as any);
    render(<About />);
    expect(
      screen.getByText(/servicio integral de impresión 3D/i)
    ).toBeInTheDocument();
  });

  it('renders a mission statement about innovative 3D printing solutions', () => {
    vi.mocked(useApiData).mockReturnValue({ aboutSections: mockSections, aboutLoading: false, aboutError: null } as any);
    render(<About />);
    expect(
      screen.getByText(/innovación accesible/i)
    ).toBeInTheDocument();
  });

  it('renders both headings as h2 elements', () => {
    vi.mocked(useApiData).mockReturnValue({ aboutSections: mockSections, aboutLoading: false, aboutError: null } as any);
    render(<About />);
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent('Impresión 3D Personalizada');
    expect(headings[1]).toHaveTextContent('Nuestra Misión');
  });

  it('wraps each subsection in a Panel95 component', () => {
    vi.mocked(useApiData).mockReturnValue({ aboutSections: mockSections, aboutLoading: false, aboutError: null } as any);
    const { container } = render(<About />);
    // Panel95 renders divs with the panel class — we expect two panel wrappers
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    const panels = section!.children;
    expect(panels).toHaveLength(2);
  });
});
