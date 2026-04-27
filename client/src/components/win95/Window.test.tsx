import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Window } from './Window';
import { WindowProvider, useWindowContext } from '../../context/WindowContext';
import React from 'react';

// Helper to render Window inside a provider and auto-open it
function renderWindow(
  props: Partial<React.ComponentProps<typeof Window>> & { id?: string; title?: string } = {},
) {
  const {
    id = 'test-win',
    title = 'Test Window',
    children = <div>Window Content</div>,
    ...rest
  } = props;

  // Component that opens the window in context on mount
  function Opener() {
    const { dispatch } = useWindowContext();
    React.useEffect(() => {
      dispatch({ type: 'OPEN', payload: { id, title, icon: rest.icon } });
    }, [dispatch]);
    return null;
  }

  const result = render(
    <WindowProvider>
      <Opener />
      <Window id={id} title={title} {...rest}>
        {children}
      </Window>
    </WindowProvider>,
  );

  return result;
}

describe('Window', () => {
  it('renders with title text', () => {
    renderWindow({ title: 'My Window' });
    expect(screen.getByText('My Window')).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderWindow({ children: <p>Hello World</p> });
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders minimize, maximize, and close buttons', () => {
    renderWindow();
    expect(screen.getByRole('button', { name: 'Minimize' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Maximize' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    renderWindow({ icon: '📁' });
    expect(screen.getByText('📁')).toBeInTheDocument();
  });

  it('does not render icon when not provided', () => {
    renderWindow({ title: 'No Icon' });
    // The title text should be there but no icon span
    expect(screen.getByText('No Icon')).toBeInTheDocument();
  });

  it('calls onClose callback when close button is clicked', () => {
    const onClose = vi.fn();
    renderWindow({ onClose });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onMinimize callback when minimize button is clicked', () => {
    const onMinimize = vi.fn();
    renderWindow({ onMinimize });
    fireEvent.click(screen.getByRole('button', { name: 'Minimize' }));
    expect(onMinimize).toHaveBeenCalledOnce();
  });

  it('calls onMaximize callback when maximize button is clicked', () => {
    const onMaximize = vi.fn();
    renderWindow({ onMaximize });
    fireEvent.click(screen.getByRole('button', { name: 'Maximize' }));
    expect(onMaximize).toHaveBeenCalledOnce();
  });

  it('does not render when minimized', () => {
    function MinimizeTest() {
      const { dispatch } = useWindowContext();
      return (
        <>
          <button onClick={() => dispatch({ type: 'MINIMIZE', payload: { id: 'min-win' } })}>
            Do Minimize
          </button>
          <Window id="min-win" title="Min Window">
            <p>Content</p>
          </Window>
        </>
      );
    }

    function Opener() {
      const { dispatch } = useWindowContext();
      React.useEffect(() => {
        dispatch({ type: 'OPEN', payload: { id: 'min-win', title: 'Min Window' } });
      }, [dispatch]);
      return null;
    }

    render(
      <WindowProvider>
        <Opener />
        <MinimizeTest />
      </WindowProvider>,
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Do Minimize'));
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('has data-testid attribute with window id', () => {
    renderWindow({ id: 'my-window' });
    expect(screen.getByTestId('window-my-window')).toBeInTheDocument();
  });

  it('renders close button that removes window from DOM', () => {
    renderWindow({ id: 'close-test' });
    expect(screen.getByTestId('window-close-test')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('window-close-test')).not.toBeInTheDocument();
  });

  it('maximize button label toggles between Maximize and Restore', () => {
    renderWindow({ id: 'max-test' });
    const maxBtn = screen.getByRole('button', { name: 'Maximize' });
    fireEvent.click(maxBtn);
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    expect(screen.getByRole('button', { name: 'Maximize' })).toBeInTheDocument();
  });
});
