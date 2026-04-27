import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button95 } from './Button95';

describe('Button95', () => {
  it('renders children text', () => {
    render(<Button95>Click me</Button95>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button95 onClick={handleClick}>Click</Button95>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button95 onClick={handleClick} disabled>Click</Button95>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders as disabled with disabled attribute', () => {
    render(<Button95 disabled>Disabled</Button95>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('defaults to type="button"', () => {
    render(<Button95>Btn</Button95>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('accepts type="submit"', () => {
    render(<Button95 type="submit">Submit</Button95>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('applies custom className', () => {
    render(<Button95 className="custom-class">Btn</Button95>);
    expect(screen.getByRole('button').className).toContain('custom-class');
  });

  it('renders children as JSX elements', () => {
    render(
      <Button95>
        <span data-testid="icon">🖥️</span> Start
      </Button95>
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Start');
  });
});
