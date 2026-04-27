import React from 'react';
import type { Service } from '../../types';
import { Panel95 } from '../win95/Panel95';
import styles from './Services.module.css';

export interface ServiceCardProps {
  service: Service;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  return (
    <Panel95 variant="raised" className={styles.card}>
      <span className={styles.cardIcon} role="img" aria-label={`${service.title} icon`}>
        {service.icon}
      </span>
      <h3 className={styles.cardTitle}>{service.title}</h3>
      <p className={styles.cardDescription}>{service.description}</p>
    </Panel95>
  );
};

export default ServiceCard;
