import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders the copyright text', () => {
    render(<Footer />);
    expect(screen.getByText('© 2026. All rights reserved.')).toBeInTheDocument();
  });

  it('renders a footer element', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('wraps content in a Panel95 component', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');
    // Panel95 renders a div child inside the footer
    expect(footer!.children).toHaveLength(1);
    const panel = footer!.children[0];
    expect(panel.tagName).toBe('DIV');
  });

  it('renders the copyright text inside a paragraph element', () => {
    const { container } = render(<Footer />);
    const paragraph = container.querySelector('p');
    expect(paragraph).toBeInTheDocument();
    expect(paragraph).toHaveTextContent('© 2026. All rights reserved.');
  });
});
