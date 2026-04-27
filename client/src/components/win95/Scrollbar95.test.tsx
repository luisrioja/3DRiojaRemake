import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Scrollbar95 } from './Scrollbar95';

describe('Scrollbar95', () => {
  it('renders children content', () => {
    render(<Scrollbar95>Scrollable content</Scrollbar95>);
    expect(screen.getByText('Scrollable content')).toBeInTheDocument();
  });

  it('renders children as JSX elements', () => {
    render(
      <Scrollbar95>
        <span data-testid="inner">Nested</span>
      </Scrollbar95>
    );
    expect(screen.getByTestId('inner')).toBeInTheDocument();
  });

  it('applies the scrollable class', () => {
    render(<Scrollbar95>Styled</Scrollbar95>);
    const el = screen.getByText('Styled').closest('div')!;
    expect(el.className).toContain('scrollable');
  });

  it('applies custom className', () => {
    render(<Scrollbar95 className="my-class">Custom</Scrollbar95>);
    const el = screen.getByText('Custom').closest('div')!;
    expect(el.className).toContain('my-class');
  });

  it('combines scrollable and custom className', () => {
    render(<Scrollbar95 className="extra">Both</Scrollbar95>);
    const el = screen.getByText('Both').closest('div')!;
    expect(el.className).toContain('scrollable');
    expect(el.className).toContain('extra');
  });

  it('applies maxHeight as inline style', () => {
    render(<Scrollbar95 maxHeight="200px">Height</Scrollbar95>);
    const el = screen.getByText('Height').closest('div')!;
    expect(el.style.maxHeight).toBe('200px');
  });

  it('applies maxWidth as inline style', () => {
    render(<Scrollbar95 maxWidth={300}>Width</Scrollbar95>);
    const el = screen.getByText('Width').closest('div')!;
    expect(el.style.maxWidth).toBe('300px');
  });

  it('applies both maxHeight and maxWidth', () => {
    render(<Scrollbar95 maxHeight="100px" maxWidth="200px">Both dims</Scrollbar95>);
    const el = screen.getByText('Both dims').closest('div')!;
    expect(el.style.maxHeight).toBe('100px');
    expect(el.style.maxWidth).toBe('200px');
  });

  it('does not set inline style when maxHeight/maxWidth are omitted', () => {
    render(<Scrollbar95>No dims</Scrollbar95>);
    const el = screen.getByText('No dims').closest('div')!;
    expect(el.style.maxHeight).toBe('');
    expect(el.style.maxWidth).toBe('');
  });

  it('renders as a div element', () => {
    render(<Scrollbar95>Div check</Scrollbar95>);
    const el = screen.getByText('Div check');
    expect(el.closest('div')).toBeTruthy();
  });
});
