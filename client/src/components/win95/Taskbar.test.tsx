import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Taskbar } from './Taskbar';
import type { WindowState } from '../../types';

function makeWindow(overrides: Partial<WindowState> & { id: string; title: string }): WindowState {
  return {
    position: { x: 0, y: 0 },
    size: { width: 400, height: 300 },
    isMinimized: false,
    isMaximized: false,
    zIndex: 1,
    ...overrides,
  };
}

describe('Taskbar', () => {
  const defaultProps = {
    windows: [] as WindowState[],
    onWindowClick: vi.fn(),
    onStartClick: vi.fn(),
    isStartMenuOpen: false,
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the Start button with "Inicio" text', () => {
    render(<Taskbar {...defaultProps} />);
    expect(screen.getByText(/Inicio/)).toBeInTheDocument();
  });

  it('calls onStartClick when Start button is clicked', () => {
    const onStartClick = vi.fn();
    render(<Taskbar {...defaultProps} onStartClick={onStartClick} />);
    fireEvent.click(screen.getByText(/Inicio/));
    expect(onStartClick).toHaveBeenCalledOnce();
  });

  it('renders a button for each open window', () => {
    const windows = [
      makeWindow({ id: 'w1', title: 'Portfolio', zIndex: 1 }),
      makeWindow({ id: 'w2', title: 'Servicios', zIndex: 2 }),
    ];
    render(<Taskbar {...defaultProps} windows={windows} />);
    expect(screen.getByTitle('Portfolio')).toBeInTheDocument();
    expect(screen.getByTitle('Servicios')).toBeInTheDocument();
  });

  it('calls onWindowClick with the correct id when a window button is clicked', () => {
    const onWindowClick = vi.fn();
    const windows = [makeWindow({ id: 'w1', title: 'Portfolio', zIndex: 1 })];
    render(<Taskbar {...defaultProps} windows={windows} onWindowClick={onWindowClick} />);
    fireEvent.click(screen.getByTitle('Portfolio'));
    expect(onWindowClick).toHaveBeenCalledWith('w1');
  });

  it('shows the focused (highest zIndex, non-minimized) window button as active', () => {
    const windows = [
      makeWindow({ id: 'w1', title: 'Portfolio', zIndex: 1 }),
      makeWindow({ id: 'w2', title: 'Servicios', zIndex: 5 }),
    ];
    render(<Taskbar {...defaultProps} windows={windows} />);
    const activeBtn = screen.getByTitle('Servicios');
    expect(activeBtn.className).toContain('Active');
    const inactiveBtn = screen.getByTitle('Portfolio');
    expect(inactiveBtn.className).not.toContain('Active');
  });

  it('does not mark minimized windows as active even if they have highest zIndex', () => {
    const windows = [
      makeWindow({ id: 'w1', title: 'Portfolio', zIndex: 1 }),
      makeWindow({ id: 'w2', title: 'Servicios', zIndex: 5, isMinimized: true }),
    ];
    render(<Taskbar {...defaultProps} windows={windows} />);
    const minimizedBtn = screen.getByTitle('Servicios');
    expect(minimizedBtn.className).not.toContain('Active');
    const visibleBtn = screen.getByTitle('Portfolio');
    expect(visibleBtn.className).toContain('Active');
  });

  it('renders the clock/tray area', () => {
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30));
    render(<Taskbar {...defaultProps} />);
    expect(screen.getByText('14:30')).toBeInTheDocument();
  });

  it('renders with no window buttons when windows array is empty', () => {
    render(<Taskbar {...defaultProps} windows={[]} />);
    const list = screen.getByRole('list', { name: /ventanas abiertas/i });
    expect(list.children).toHaveLength(0);
  });

  it('has the taskbar role and label', () => {
    render(<Taskbar {...defaultProps} />);
    expect(screen.getByRole('toolbar', { name: /barra de tareas/i })).toBeInTheDocument();
  });
});
