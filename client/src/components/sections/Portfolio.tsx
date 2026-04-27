import React, { useState } from 'react';
import type { PortfolioProject } from '../../types';
import { Panel95 } from '../win95/Panel95';
import { Button95 } from '../win95/Button95';
import { PortfolioItem } from './PortfolioItem';
import styles from './Portfolio.module.css';

export interface PortfolioProps {
  projects: PortfolioProject[];
  loading?: boolean;
  error?: string | null;
}

export const Portfolio: React.FC<PortfolioProps> = ({
  projects,
  loading = false,
  error = null,
}) => {
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  const handleProjectClick = (project: PortfolioProject) => {
    setSelectedProject(project);
  };

  const handleClose = () => {
    setSelectedProject(null);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <section className={styles.portfolio}>
      <h2 className={styles.heading}>Nuestro Portfolio</h2>

      {loading && (
        <Panel95 variant="sunken">
          <p className={styles.loading}>Cargando portfolio...</p>
        </Panel95>
      )}

      {error && (
        <Panel95 variant="sunken">
          <p className={styles.error}>{error}</p>
        </Panel95>
      )}

      {!loading && !error && (
        <div className={styles.grid}>
          {projects.map((project) => (
            <PortfolioItem
              key={project.id}
              project={project}
              onClick={handleProjectClick}
            />
          ))}
        </div>
      )}

      {selectedProject && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-label={`Detalles de ${selectedProject.title}`}
          onClick={handleOverlayClick}
        >
          <Panel95 variant="raised" className={styles.detail}>
            <div className={styles.detailTitleBar}>
              <span>{selectedProject.title}</span>
              <Button95 size="sm" onClick={handleClose}>✕</Button95>
            </div>
            <div className={styles.detailImageWrapper}>
              <img
                className={styles.detailImage}
                src={selectedProject.image}
                alt={selectedProject.title}
              />
            </div>
            <p className={styles.detailDescription}>
              {selectedProject.description}
            </p>
          </Panel95>
        </div>
      )}
    </section>
  );
};

export default Portfolio;
