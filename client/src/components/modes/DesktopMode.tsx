import React, { useState, useCallback, useMemo } from 'react';
import { WindowProvider, useWindowContext } from '../../context/WindowContext';
import { DesktopIcon } from '../win95/DesktopIcon';
import { Taskbar } from '../win95/Taskbar';
import { StartMenu } from '../win95/StartMenu';
import { Window } from '../win95/Window';
import type { StartMenuItem } from '../win95/StartMenu';
import { Hero } from '../sections/Hero';
import { About } from '../sections/About';
import { Services } from '../sections/Services';
import { Portfolio } from '../sections/Portfolio';
import { Testimonials } from '../sections/Testimonials';
import { Contact } from '../sections/Contact';
import { Footer } from '../sections/Footer';
import { useApiData } from '../../hooks/useApiData';
import styles from './DesktopMode.module.css';

interface DesktopSection {
  id: string;
  label: string;
  icon: string;
}

const DESKTOP_SECTIONS: DesktopSection[] = [
  { id: 'portfolio', label: 'Portfolio', icon: '/images/icons/folder.svg' },
  { id: 'servicios', label: 'Servicios', icon: '/images/icons/wrench.svg' },
  { id: 'sobre-nosotros', label: 'Sobre Nosotros', icon: '/images/icons/info.svg' },
  { id: 'contacto', label: 'Contacto', icon: '/images/icons/mail.svg' },
  { id: 'testimonios', label: 'Testimonios', icon: '/images/icons/star.svg' },
];

export interface DesktopModeProps {
  onModeSwitch: () => void;
}

function WindowContent({ windowId, apiData }: { windowId: string; apiData: ReturnType<typeof useApiData> }) {
  switch (windowId) {
    case 'hero':
      return <Hero />;
    case 'sobre-nosotros':
      return <About />;
    case 'servicios':
      return (
        <Services
          services={apiData.services}
          loading={apiData.servicesLoading}
          error={apiData.servicesError}
        />
      );
    case 'portfolio':
      return (
        <Portfolio
          projects={apiData.projects}
          loading={apiData.projectsLoading}
          error={apiData.projectsError}
        />
      );
    case 'testimonios':
      return (
        <Testimonials
          testimonials={apiData.testimonials}
          loading={apiData.testimonialsLoading}
          error={apiData.testimonialsError}
        />
      );
    case 'contacto':
      return <Contact />;
    case 'footer':
      return <Footer />;
    default:
      return <div>Contenido de {windowId}</div>;
  }
}

function DesktopModeInner({ onModeSwitch }: DesktopModeProps) {
  const { windows, dispatch } = useWindowContext();
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const apiData = useApiData();

  const openSection = useCallback(
    (section: DesktopSection) => {
      dispatch({
        type: 'OPEN',
        payload: { id: section.id, title: section.label, icon: section.icon },
      });
    },
    [dispatch],
  );

  const handleWindowClick = useCallback(
    (windowId: string) => {
      dispatch({ type: 'FOCUS', payload: { id: windowId } });
    },
    [dispatch],
  );

  const handleStartClick = useCallback(() => {
    setIsStartMenuOpen((prev) => !prev);
  }, []);

  const handleStartMenuClose = useCallback(() => {
    setIsStartMenuOpen(false);
  }, []);

  const startMenuItems: StartMenuItem[] = useMemo(
    () =>
      DESKTOP_SECTIONS.map((section) => ({
        id: section.id,
        label: section.label,
        icon: section.icon,
        action: () => openSection(section),
      })),
    [openSection],
  );

  return (
    <>
      <div className={styles.desktop} data-testid="desktop">
        {/* Desktop icons */}
        <div className={styles.iconArea} data-testid="icon-area">
          {DESKTOP_SECTIONS.map((section) => (
            <DesktopIcon
              key={section.id}
              id={section.id}
              label={section.label}
              icon={section.icon}
              onDoubleClick={() => openSection(section)}
            />
          ))}
        </div>

        {/* Open windows */}
        {windows.map((win) => (
          <Window key={win.id} id={win.id} title={win.title} icon={win.icon}>
            <WindowContent windowId={win.id} apiData={apiData} />
          </Window>
        ))}
      </div>

      {/* Start menu */}
      {isStartMenuOpen && (
        <StartMenu
          items={startMenuItems}
          onModeSwitch={onModeSwitch}
          onClose={handleStartMenuClose}
        />
      )}

      {/* Taskbar */}
      <Taskbar
        windows={windows}
        onWindowClick={handleWindowClick}
        onStartClick={handleStartClick}
        isStartMenuOpen={isStartMenuOpen}
      />
    </>
  );
}

export const DesktopMode: React.FC<DesktopModeProps> = (props) => {
  return (
    <WindowProvider>
      <DesktopModeInner {...props} />
    </WindowProvider>
  );
};

export default DesktopMode;
