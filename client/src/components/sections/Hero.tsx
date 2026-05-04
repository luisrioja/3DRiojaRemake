import React from 'react';
import { Panel95 } from '../win95/Panel95';
import { Button95 } from '../win95/Button95';
import styles from './Hero.module.css';

export interface HeroProps {
  onNavigate?: (sectionId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <Panel95 variant="raised" className={styles.hero}>
      <div className={styles.logo}><img src="/images/logo.svg" alt="3DRioja" width="32" height="32" /> 3DRioja</div>
      <h1 className={styles.title}>Impresión 3D Personalizada para Todos</h1>
      <div className={styles.actions}>
        <Button95 onClick={() => onNavigate?.('portfolio')}>Ver</Button95>
        <Button95 onClick={() => onNavigate?.('contacto')}>Contáctanos</Button95>
      </div>
    </Panel95>
  );
};

export default Hero;
