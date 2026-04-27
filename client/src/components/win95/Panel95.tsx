import React from 'react';
import styles from './Panel95.module.css';

export interface Panel95Props {
  children: React.ReactNode;
  variant?: 'raised' | 'sunken' | 'flat';
  className?: string;
}

export const Panel95: React.FC<Panel95Props> = ({
  children,
  variant = 'raised',
  className,
}) => {
  const classNames = [
    styles.panel,
    styles[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames}>
      {children}
    </div>
  );
};

export default Panel95;
