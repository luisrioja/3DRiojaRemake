import React, { useState, useCallback } from 'react';
import styles from './DesktopIcon.module.css';

export interface DesktopIconProps {
  id: string;
  label: string;
  icon: string;
  position?: { row: number; col: number };
  onDoubleClick: () => void;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  id,
  label,
  icon,
  onDoubleClick,
}) => {
  const [selected, setSelected] = useState(false);

  const handleClick = useCallback(() => {
    setSelected(true);
  }, []);

  const handleBlur = useCallback(() => {
    setSelected(false);
  }, []);

  const handleDoubleClick = useCallback(() => {
    onDoubleClick();
  }, [onDoubleClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        onDoubleClick();
      }
    },
    [onDoubleClick],
  );

  const isImage = icon.startsWith('/') || icon.startsWith('http') || icon.startsWith('.');

  const classNames = [styles.desktopIcon, selected ? styles.selected : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={label}
      data-icon-id={id}
    >
      <div className={styles.iconWrapper}>
        {isImage ? <img src={icon} alt="" /> : <span>{icon}</span>}
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  );
};

export default DesktopIcon;
