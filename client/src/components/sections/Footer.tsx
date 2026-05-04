import React from 'react';
import { Panel95 } from '../win95/Panel95';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer>
      <Panel95 variant="raised" className={styles.footer}>
        <p className={styles.text}>© 2026. All rights reserved.</p>
      </Panel95>
    </footer>
  );
};

export default Footer;
