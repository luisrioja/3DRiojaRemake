import React from 'react';
import styles from './Scrollbar95.module.css';

export interface Scrollbar95Props {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string | number;
  maxWidth?: string | number;
}

export const Scrollbar95: React.FC<Scrollbar95Props> = ({
  children,
  className,
  maxHeight,
  maxWidth,
}) => {
  const classNames = [styles.scrollable, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      style={{ maxHeight, maxWidth }}
    >
      {children}
    </div>
  );
};

export default Scrollbar95;
