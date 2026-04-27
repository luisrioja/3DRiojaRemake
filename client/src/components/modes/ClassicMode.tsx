import React, { useState, useCallback } from 'react';
import { Panel95 } from '../win95/Panel95';
import { Button95 } from '../win95/Button95';
import { Hero } from '../sections/Hero';
import { About } from '../sections/About';
import { Services } from '../sections/Services';
import { Portfolio } from '../sections/Portfolio';
import { Testimonials } from '../sections/Testimonials';
import { Contact } from '../sections/Contact';
import { Footer } from '../sections/Footer';
import { useApiData } from '../../hooks/useApiData';
import styles from './ClassicMode.module.css';

interface ClassicSection {
  id: string;
  label: string;
  icon: string;
}

const SECTIONS: ClassicSection[] = [
  { id: 'portfolio', label: 'Portfolio', icon: '📁' },
  { id: 'servicios', label: 'Servicios', icon: '🔧' },
  { id: 'sobre-nosotros', label: 'Sobre Nosotros', icon: 'ℹ️' },
  { id: 'contacto', label: 'Contacto', icon: '✉️' },
  { id: 'testimonios', label: 'Testimonios', icon: '⭐' },
];

export interface ClassicModeProps {
  onModeSwitch: () => void;
}

export const ClassicMode: React.FC<ClassicModeProps> = ({ onModeSwitch }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const apiData = useApiData();

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const scrollToSection = useCallback(
    (sectionId: string) => {
      closeMobileMenu();
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [closeMobileMenu],
  );

  return (
    <div data-testid="classic-mode">
      {/* ── Navigation bar ── */}
      <nav className={styles.navbar} role="navigation" aria-label="Navegación principal">
        <span className={styles.navBrand}>3DRioja</span>

        {/* Desktop nav links */}
        <ul className={styles.navLinks} role="menubar">
          {SECTIONS.map((section) => (
            <li key={section.id} role="none">
              <button
                role="menuitem"
                className={styles.navLink}
                onClick={() => scrollToSection(section.id)}
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Desktop mode switch button */}
        <div className={styles.modeSwitchBtn}>
          <Button95 size="sm" onClick={onModeSwitch}>
            Modo Escritorio
          </Button95>
        </div>

        {/* Mobile hamburger */}
        <button
          className={styles.hamburger}
          onClick={toggleMobileMenu}
          aria-label="Abrir menú"
          aria-expanded={isMobileMenuOpen}
        >
          ☰
        </button>
      </nav>

      {/* ── Mobile dropdown menu ── */}
      {isMobileMenuOpen && (
        <div className={styles.mobileMenu} role="menu" aria-label="Menú móvil">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              role="menuitem"
              className={styles.navLink}
              onClick={() => scrollToSection(section.id)}
            >
              {section.label}
            </button>
          ))}
          <button
            role="menuitem"
            className={styles.navLink}
            onClick={() => {
              closeMobileMenu();
              onModeSwitch();
            }}
          >
            Modo Escritorio
          </button>
        </div>
      )}

      {/* ── Content sections ── */}
      <main className={styles.content}>
        <div id="hero" className={styles.section}>
          <Hero onNavigate={scrollToSection} />
        </div>

        {SECTIONS.map((section) => (
          <div key={section.id} id={section.id} className={styles.section}>
            <Panel95 variant="raised">
              <div className={styles.sectionTitleBar}>
                <span className={styles.sectionIcon}>{section.icon}</span>
                {section.label}
              </div>
              <div className={styles.sectionBody}>
                {section.id === 'portfolio' && (
                  <Portfolio
                    projects={apiData.projects}
                    loading={apiData.projectsLoading}
                    error={apiData.projectsError}
                  />
                )}
                {section.id === 'servicios' && (
                  <Services
                    services={apiData.services}
                    loading={apiData.servicesLoading}
                    error={apiData.servicesError}
                  />
                )}
                {section.id === 'sobre-nosotros' && <About />}
                {section.id === 'contacto' && <Contact />}
                {section.id === 'testimonios' && (
                  <Testimonials
                    testimonials={apiData.testimonials}
                    loading={apiData.testimonialsLoading}
                    error={apiData.testimonialsError}
                  />
                )}
              </div>
            </Panel95>
          </div>
        ))}

        <div id="footer" className={styles.section}>
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default ClassicMode;
