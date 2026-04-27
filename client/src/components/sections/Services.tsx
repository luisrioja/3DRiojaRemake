import React from 'react';
import type { Service } from '../../types';
import { Panel95 } from '../win95/Panel95';
import { ServiceCard } from './ServiceCard';
import styles from './Services.module.css';

export interface ServicesProps {
  services: Service[];
  loading?: boolean;
  error?: string | null;
}

export const Services: React.FC<ServicesProps> = ({
  services,
  loading = false,
  error = null,
}) => {
  return (
    <section className={styles.services}>
      <h2 className={styles.heading}>Servicios Personalizados</h2>

      {loading && (
        <Panel95 variant="sunken">
          <p className={styles.loading}>Cargando servicios...</p>
        </Panel95>
      )}

      {error && (
        <Panel95 variant="sunken">
          <p className={styles.error}>{error}</p>
        </Panel95>
      )}

      {!loading && !error && (
        <div className={styles.grid}>
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </section>
  );
};

export default Services;
