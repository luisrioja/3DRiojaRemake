import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StartMenu } from './StartMenu';
import type { StartMenuItem } from './StartMenu';

function makeItems(): StartMenuItem[] {
  return [
    { id: 'portfolio', label: 'Portfolio', icon: '📁', action: vi.fn() },
    { id: 'servicios', label: 'Servicios', icon: '🔧', action: vi.fn() },
    { id: 'contacto', label: 'Contacto', icon: '✉️', action: vi.fn() },
  ];
}

describe('StartMenu', () => {
  const defaultProps = {
    items: makeItems(),
    onModeSwitch: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders the menu with role="menu" and accessible label', () => {
    render(<StartMenu {...defaultProps} />);
    expect(screen.getByRole('menu', { name: /menú inicio/i })).toBeInTheDocument();
  });

  it('renders the vertical sidebar with "3DRioja" text', () => {
    render(<StartMenu {...defaultProps} />);
    expect(screen.getByText('3DRioja')).toBeInTheDocument();
  });

  it('renders all menu items with their labels', () => {
    const items = makeItems();
    render(<StartMenu {...defaultProps} items={items} />);
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Servicios')).toBeInTheDocument();
    expect(screen.getByText('Contacto')).toBeInTheDocument();
  });

  it('renders the "Modo Clásico" option', () => {
    render(<StartMenu {...defaultProps} />);
    expect(screen.getByText('Modo Clásico')).toBeInTheDocument();
  });

  it('calls item action and onClose when a menu item is clicked', () => {
    const items = makeItems();
    const onClose = vi.fn();
    render(<StartMenu {...defaultProps} items={items} onClose={onClose} />);
    fireEvent.click(screen.getByText('Portfolio'));
    expect(items[0].action).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onModeSwitch and onClose when "Modo Clásico" is clicked', () => {
    const onModeSwitch = vi.fn();
    const onClose = vi.fn();
    render(<StartMenu {...defaultProps} onModeSwitch={onModeSwitch} onClose={onClose} />);
    fireEvent.click(screen.getByText('Modo Clásico'));
    expect(onModeSwitch).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the overlay is clicked (outside click)', () => {
    const onClose = vi.fn();
    render(<StartMenu {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('start-menu-overlay'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<StartMenu {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders menu items with role="menuitem"', () => {
    const items = makeItems();
    render(<StartMenu {...defaultProps} items={items} />);
    const menuItems = screen.getAllByRole('menuitem');
    // 3 items + 1 mode switch = 4
    expect(menuItems).toHaveLength(4);
  });

  it('renders icons for items that have them', () => {
    const items = [
      { id: 'with-icon', label: 'Con Icono', icon: '📁', action: vi.fn() },
      { id: 'no-icon', label: 'Sin Icono', action: vi.fn() },
    ];
    render(<StartMenu {...defaultProps} items={items} />);
    expect(screen.getByText('📁')).toBeInTheDocument();
    expect(screen.getByText('Con Icono')).toBeInTheDocument();
    expect(screen.getByText('Sin Icono')).toBeInTheDocument();
  });
});
