import React from 'react';
import type { PortfolioProject } from '../../types';
import { Panel95 } from '../win95/Panel95';
import styles from './Portfolio.module.css';

export interface PortfolioItemProps {
  project: PortfolioProject;
  onClick?: (project: PortfolioProject) => void;
}

export const PortfolioItem: React.FC<PortfolioItemProps> = ({ project, onClick }) => {
  const handleClick = () => {
    onClick?.(project);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(project);
    }
  };

  return (
    <Panel95
      variant="raised"
      className={styles.card}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`Ver detalles de ${project.title}`}
      >
        <div className={styles.imageWrapper}>
          <img
            className={styles.image}
            src={project.image}
            alt={project.title}
          />
        </div>
        <h3 className={styles.cardTitle}>{project.title}</h3>
        <p className={styles.cardDescription}>{project.description}</p>
      </div>
    </Panel95>
  );
};

export default PortfolioItem;
