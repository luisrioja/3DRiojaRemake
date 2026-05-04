import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { Panel95 } from '../win95/Panel95';
import { Button95 } from '../win95/Button95';
import { PortfolioManager } from './PortfolioManager';
import { ServicesManager } from './ServicesManager';
import { AboutManager } from './AboutManager';
import { NewsletterManager } from './NewsletterManager';
import styles from './AdminDashboard.module.css';

type Section = 'portfolio' | 'servicios' | 'about' | 'newsletter';

export const AdminDashboard: React.FC = () => {
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>('portfolio');

  const handleLogout = async () => {
    await logout();
    navigate('/admin/');
  };

  return (
    <div className={styles.container}>
      <Panel95 variant="raised" className={styles.window}>
        <div className={styles.titleBar}>
          <span className={styles.titleIcon}>💼</span>
          <span>Panel de Administración — 3DRioja</span>
        </div>

        <div className={styles.toolbar}>
          <Button95
            variant={activeSection === 'portfolio' ? 'default' : 'flat'}
            size="sm"
            onClick={() => setActiveSection('portfolio')}
            className={activeSection === 'portfolio' ? styles.navButtonActive : styles.navButton}
          >
            📁 Portfolio
          </Button95>
          <Button95
            variant={activeSection === 'servicios' ? 'default' : 'flat'}
            size="sm"
            onClick={() => setActiveSection('servicios')}
            className={activeSection === 'servicios' ? styles.navButtonActive : styles.navButton}
          >
            🔧 Servicios
          </Button95>
          <Button95
            variant={activeSection === 'about' ? 'default' : 'flat'}
            size="sm"
            onClick={() => setActiveSection('about')}
            className={activeSection === 'about' ? styles.navButtonActive : styles.navButton}
          >
            ℹ️ Sobre Nosotros
          </Button95>
          <Button95
            variant={activeSection === 'newsletter' ? 'default' : 'flat'}
            size="sm"
            onClick={() => setActiveSection('newsletter')}
            className={activeSection === 'newsletter' ? styles.navButtonActive : styles.navButton}
          >
            📧 Newsletter
          </Button95>

          <div className={styles.separator} />
          <div className={styles.spacer} />

          <Button95 size="sm" onClick={handleLogout}>
            🚪 Cerrar sesión
          </Button95>
        </div>

        <div className={styles.content}>
          {activeSection === 'portfolio' && (
            <PortfolioManager />
          )}
          {activeSection === 'servicios' && (
            <ServicesManager />
          )}
          {activeSection === 'about' && (
            <AboutManager />
          )}
          {activeSection === 'newsletter' && (
            <NewsletterManager />
          )}
        </div>
      </Panel95>
    </div>
  );
};

export default AdminDashboard;
