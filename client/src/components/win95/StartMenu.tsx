import React, { useEffect, useRef } from 'react';
import styles from './StartMenu.module.css';

export interface StartMenuItem {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
}

export interface StartMenuProps {
  items: StartMenuItem[];
  onModeSwitch: () => void;
  onClose: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  items,
  onModeSwitch,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleItemClick = (action: () => void) => {
    action();
    onClose();
  };

  const handleModeSwitchClick = () => {
    onModeSwitch();
    onClose();
  };

  return (
    <>
      {/* Invisible overlay to catch outside clicks */}
      <div
        className={styles.overlay}
        onClick={onClose}
        data-testid="start-menu-overlay"
        aria-hidden="true"
      />

      <nav
        ref={menuRef}
        className={styles.startMenu}
        role="menu"
        aria-label="Menú Inicio"
      >
        {/* Vertical blue sidebar */}
        <div className={styles.sidebar} aria-hidden="true">
          <span className={styles.sidebarText}>3DRioja</span>
        </div>

        {/* Menu items */}
        <div className={styles.menuItems}>
          {items.map((item) => (
            <button
              key={item.id}
              className={styles.menuItem}
              role="menuitem"
              onClick={() => handleItemClick(item.action)}
            >
              {item.icon && (
                <span className={styles.menuItemIcon} aria-hidden="true">
                  {item.icon.startsWith('/') ? <img src={item.icon} alt="" width="16" height="16" /> : item.icon}
                </span>
              )}
              <span className={styles.menuItemLabel}>{item.label}</span>
            </button>
          ))}

          {/* Divider before mode switch */}
          <div className={styles.divider} aria-hidden="true" />

          {/* Mode switch option */}
          <button
            className={styles.modeSwitchItem}
            role="menuitem"
            onClick={handleModeSwitchClick}
          >
            <span className={styles.menuItemIcon} aria-hidden="true">
              <img src="/images/icons/refresh.svg" alt="" width="16" height="16" />
            </span>
            <span className={styles.menuItemLabel}>Modo Clásico</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default StartMenu;
