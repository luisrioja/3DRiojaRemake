import React from 'react';
import styles from './Button95.module.css';

export interface Button95Props {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'flat' | 'start';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button95: React.FC<Button95Props> = ({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'md',
  className,
  type = 'button',
}) => {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classNames}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button95;
