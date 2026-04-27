import React, { useState, useEffect } from 'react';
import type { WindowState } from '../../types';
import { Button95 } from './Button95';
import styles from './Taskbar.module.css';

export interface TaskbarProps {
  windows: WindowState[];
  onWindowClick: (windowId: string) => void;
  onStartClick: () => void;
  isStartMenuOpen: boolean;
}

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  windows,
  onWindowClick,
  onStartClick,
  isStartMenuOpen,
}) => {
  const [time, setTime] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(formatTime(new Date()));
    }, 10_000);
    return () => clearInterval(timer);
  }, []);

  // Determine focused window (highest zIndex among non-minimized)
  const focusedId = React.useMemo(() => {
    const visible = windows.filter((w) => !w.isMinimized);
    if (visible.length === 0) return null;
    return visible.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).id;
  }, [windows]);

  return (
    <div className={styles.taskbar} role="toolbar" aria-label="Barra de tareas">
      {/* Start button */}
      <div className={styles.startArea}>
        <Button95
          variant="start"
          onClick={onStartClick}
          aria-expanded={isStartMenuOpen}
          aria-haspopup="true"
        >
          ⊞ Inicio
        </Button95>
      </div>

      <div className={styles.divider} aria-hidden="true" />

      {/* Window list */}
      <div className={styles.windowList} role="list" aria-label="Ventanas abiertas">
        {windows.map((win) => {
          const isActive = win.id === focusedId && !win.isMinimized;
          return (
            <button
              key={win.id}
              role="listitem"
              className={`${styles.windowButton} ${isActive ? styles.windowButtonActive : ''}`}
              onClick={() => onWindowClick(win.id)}
              title={win.title}
            >
              <span className={styles.windowButtonLabel}>{win.title}</span>
            </button>
          );
        })}
      </div>

      {/* Clock / tray */}
      <div className={styles.tray} aria-label="Reloj del sistema">
        {time}
      </div>
    </div>
  );
};

export default Taskbar;
