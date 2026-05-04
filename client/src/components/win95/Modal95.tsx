import React from 'react';
import { Panel95 } from './Panel95';
import { Button95 } from './Button95';
import styles from './Window.module.css'; // Reusing some window styles
import modalStyles from './Modal95.module.css';

interface Modal95Props {
  title: string;
  message: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const Modal95: React.FC<Modal95Props> = ({
  title,
  message,
  isOpen,
  onConfirm,
  onCancel,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
}) => {
  if (!isOpen) return null;

  return (
    <div className={modalStyles.overlay}>
      <Panel95 variant="raised" className={modalStyles.modal}>
        <div className={styles.titleBar}>
          <span className={styles.titleText}>{title}</span>
          <button className={styles.closeButton} onClick={onCancel}>×</button>
        </div>
        <div className={modalStyles.content}>
          <p className={modalStyles.message}>{message}</p>
          <div className={modalStyles.actions}>
            <Button95 onClick={onConfirm} className={modalStyles.button}>
              {confirmText}
            </Button95>
            <Button95 onClick={onCancel} className={modalStyles.button}>
              {cancelText}
            </Button95>
          </div>
        </div>
      </Panel95>
    </div>
  );
};
