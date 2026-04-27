import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Panel95 } from './Panel95';

describe('Panel95', () => {
  it('renders children content', () => {
    render(<Panel95>Hello Win95</Panel95>);
    expect(screen.getByText('Hello Win95')).toBeInTheDocument();
  });

  it('renders children as JSX elements', () => {
    render(
      <Panel95>
        <span data-testid="inner">Content</span>
      </Panel95>
    );
    expect(screen.getByTestId('inner')).toBeInTheDocument();
  });

  it('defaults to raised variant', () => {
    render(<Panel95>Default</Panel95>);
    const panel = screen.getByText('Default').closest('div')!;
    expect(panel.className).toContain('raised');
  });

  it('applies sunken variant class', () => {
    render(<Panel95 variant="sunken">Sunken</Panel95>);
    const panel = screen.getByText('Sunken').closest('div')!;
    expect(panel.className).toContain('sunken');
  });

  it('applies flat variant class', () => {
    render(<Panel95 variant="flat">Flat</Panel95>);
    const panel = screen.getByText('Flat').closest('div')!;
    expect(panel.className).toContain('flat');
  });

  it('applies custom className', () => {
    render(<Panel95 className="custom-class">Custom</Panel95>);
    const panel = screen.getByText('Custom').closest('div')!;
    expect(panel.className).toContain('custom-class');
  });

  it('combines variant and custom className', () => {
    render(<Panel95 variant="sunken" className="extra">Both</Panel95>);
    const panel = screen.getByText('Both').closest('div')!;
    expect(panel.className).toContain('sunken');
    expect(panel.className).toContain('extra');
  });

  it('renders as a div element', () => {
    render(<Panel95>Div check</Panel95>);
    const panel = screen.getByText('Div check');
    expect(panel.closest('div')).toBeTruthy();
  });
});
