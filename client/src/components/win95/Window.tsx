import React, { useRef, useCallback, useMemo } from 'react';
import { useDrag } from '../../hooks/useDrag';
import { useResize } from '../../hooks/useResize';
import { useWindowContext } from '../../context/WindowContext';
import type { WindowProps } from '../../types';
import styles from './Window.module.css';

const DEFAULT_POSITION = { x: 100, y: 100 };
const DEFAULT_SIZE = { width: 400, height: 300 };
const DEFAULT_MIN_SIZE = { width: 200, height: 150 };

export const Window: React.FC<WindowProps> = ({
  id,
  title,
  icon,
  initialPosition = DEFAULT_POSITION,
  initialSize = DEFAULT_SIZE,
  minSize = DEFAULT_MIN_SIZE,
  children,
  onClose,
  onMinimize,
  onMaximize,
}) => {
  const { getWindow, dispatch, focusedWindowId } = useWindowContext();
  const windowState = getWindow(id);

  const windowRef = useRef<HTMLDivElement>(null!);
  const titleBarRef = useRef<HTMLDivElement>(null!);

  const isFocused = focusedWindowId === id;
  const isMinimized = windowState?.isMinimized ?? false;
  const isMaximized = windowState?.isMaximized ?? false;
  const zIndex = windowState?.zIndex ?? 1;

  const currentPosition = windowState?.position ?? initialPosition;
  const currentSize = windowState?.size ?? initialSize;

  const handleDragEnd = useCallback(
    (position: { x: number; y: number }) => {
      dispatch({ type: 'MOVE', payload: { id, position } });
    },
    [dispatch, id],
  );

  const handleResizeEnd = useCallback(
    (size: { width: number; height: number }) => {
      dispatch({ type: 'RESIZE', payload: { id, size } });
    },
    [dispatch, id],
  );

  const dragOptions = useMemo(
    () => ({
      initialPosition: currentPosition,
      handleRef: titleBarRef as React.RefObject<HTMLElement>,
      onDragEnd: handleDragEnd,
    }),
    [currentPosition, handleDragEnd],
  );

  const { position, isDragging } = useDrag(dragOptions);

  const resizeOptions = useMemo(
    () => ({
      initialSize: currentSize,
      minSize,
      elementRef: windowRef as React.RefObject<HTMLElement>,
      onResizeEnd: handleResizeEnd,
    }),
    [currentSize, minSize, handleResizeEnd],
  );

  const { size, isResizing } = useResize(resizeOptions);

  const handleFocus = useCallback(() => {
    if (!isFocused) {
      dispatch({ type: 'FOCUS', payload: { id } });
    }
  }, [dispatch, id, isFocused]);

  const handleMinimize = useCallback(() => {
    dispatch({ type: 'MINIMIZE', payload: { id } });
    onMinimize?.();
  }, [dispatch, id, onMinimize]);

  const handleMaximize = useCallback(() => {
    if (isMaximized) {
      dispatch({ type: 'RESTORE', payload: { id } });
    } else {
      dispatch({ type: 'MAXIMIZE', payload: { id } });
    }
    onMaximize?.();
  }, [dispatch, id, isMaximized, onMaximize]);

  const handleClose = useCallback(() => {
    dispatch({ type: 'CLOSE', payload: { id } });
    onClose?.();
  }, [dispatch, id, onClose]);

  // Don't render if closed (not in context) or minimized
  if (!windowState || isMinimized) {
    return null;
  }

  const windowStyle: React.CSSProperties = isMaximized
    ? { zIndex }
    : {
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex,
      };

  const windowClassNames = [
    styles.window,
    isMaximized ? styles.windowMaximized : '',
  ]
    .filter(Boolean)
    .join(' ');

  const titleBarClassNames = [
    styles.titleBar,
    isFocused ? styles.titleBarFocused : styles.titleBarUnfocused,
  ].join(' ');

  return (
    <div
      ref={windowRef}
      className={windowClassNames}
      style={windowStyle}
      onPointerDown={handleFocus}
      data-testid={`window-${id}`}
      data-dragging={isDragging || undefined}
      data-resizing={isResizing || undefined}
    >
      <div
        ref={titleBarRef}
        className={titleBarClassNames}
        data-testid={`titlebar-${id}`}
      >
        {icon && <span className={styles.titleIcon}>{icon.startsWith('/') ? <img src={icon} alt="" width="14" height="14" /> : icon}</span>}
        <span className={styles.titleText}>{title}</span>
        <div className={styles.titleButtons}>
          <button
            className={styles.titleButton}
            onClick={handleMinimize}
            aria-label="Minimize"
            type="button"
          >
            ─
          </button>
          <button
            className={styles.titleButton}
            onClick={handleMaximize}
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
            type="button"
          >
            □
          </button>
          <button
            className={styles.titleButton}
            onClick={handleClose}
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
};

export default Window;
