import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { About } from './About';

describe('About', () => {
  it('renders the "Impresión 3D Personalizada" subsection heading', () => {
    render(<About />);
    expect(
      screen.getByRole('heading', { name: 'Impresión 3D Personalizada' })
    ).toBeInTheDocument();
  });

  it('renders the "Nuestra Misión" subsection heading', () => {
    render(<About />);
    expect(
      screen.getByRole('heading', { name: 'Nuestra Misión' })
    ).toBeInTheDocument();
  });

  it('renders a description about custom 3D printing services', () => {
    render(<About />);
    expect(
      screen.getByText(/servicio integral de impresión 3D/i)
    ).toBeInTheDocument();
  });

  it('renders a mission statement about innovative 3D printing solutions', () => {
    render(<About />);
    expect(
      screen.getByText(/innovación accesible/i)
    ).toBeInTheDocument();
  });

  it('renders both headings as h2 elements', () => {
    render(<About />);
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent('Impresión 3D Personalizada');
    expect(headings[1]).toHaveTextContent('Nuestra Misión');
  });

  it('wraps each subsection in a Panel95 component', () => {
    const { container } = render(<About />);
    // Panel95 renders divs with the panel class — we expect two panel wrappers
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    const panels = section!.children;
    expect(panels).toHaveLength(2);
  });
});
