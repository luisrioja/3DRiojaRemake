import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DesktopIcon } from './DesktopIcon';

describe('DesktopIcon', () => {
  const defaultProps = {
    id: 'portfolio',
    label: 'Portfolio',
    icon: '📁',
    onDoubleClick: vi.fn(),
  };

  it('renders the label text', () => {
    render(<DesktopIcon {...defaultProps} />);
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  it('renders emoji icon', () => {
    render(<DesktopIcon {...defaultProps} />);
    expect(screen.getByText('📁')).toBeInTheDocument();
  });

  it('renders image icon when path starts with /', () => {
    const { container } = render(<DesktopIcon {...defaultProps} icon="/images/folder.png" />);
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img).toHaveAttribute('src', '/images/folder.png');
  });

  it('calls onDoubleClick on double click', () => {
    const handleDoubleClick = vi.fn();
    render(<DesktopIcon {...defaultProps} onDoubleClick={handleDoubleClick} />);
    fireEvent.doubleClick(screen.getByRole('button', { name: 'Portfolio' }));
    expect(handleDoubleClick).toHaveBeenCalledOnce();
  });

  it('does not call onDoubleClick on single click', () => {
    const handleDoubleClick = vi.fn();
    render(<DesktopIcon {...defaultProps} onDoubleClick={handleDoubleClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Portfolio' }));
    expect(handleDoubleClick).not.toHaveBeenCalled();
  });

  it('selects on single click (adds selected class)', () => {
    render(<DesktopIcon {...defaultProps} />);
    const icon = screen.getByRole('button', { name: 'Portfolio' });
    fireEvent.click(icon);
    expect(icon.className).toContain('selected');
  });

  it('deselects on blur', () => {
    render(<DesktopIcon {...defaultProps} />);
    const icon = screen.getByRole('button', { name: 'Portfolio' });
    fireEvent.click(icon);
    expect(icon.className).toContain('selected');
    fireEvent.blur(icon);
    expect(icon.className).not.toContain('selected');
  });

  it('triggers onDoubleClick on Enter key', () => {
    const handleDoubleClick = vi.fn();
    render(<DesktopIcon {...defaultProps} onDoubleClick={handleDoubleClick} />);
    const icon = screen.getByRole('button', { name: 'Portfolio' });
    fireEvent.keyDown(icon, { key: 'Enter' });
    expect(handleDoubleClick).toHaveBeenCalledOnce();
  });

  it('is focusable via tabIndex', () => {
    render(<DesktopIcon {...defaultProps} />);
    const icon = screen.getByRole('button', { name: 'Portfolio' });
    expect(icon).toHaveAttribute('tabindex', '0');
  });

  it('sets data-icon-id attribute', () => {
    render(<DesktopIcon {...defaultProps} />);
    const icon = screen.getByRole('button', { name: 'Portfolio' });
    expect(icon).toHaveAttribute('data-icon-id', 'portfolio');
  });
});
