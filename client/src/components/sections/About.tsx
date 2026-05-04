import React from 'react';
import { Panel95 } from '../win95/Panel95';
import { useApiData } from '../../hooks/useApiData';
import styles from './About.module.css';

export const About: React.FC = () => {
  const { aboutSections: sections, aboutLoading: loading, aboutError: error } = useApiData();

  if (loading) {
    return (
      <section className={styles.about}>
        <Panel95 variant="raised" className={styles.subsection}>
          <p className={styles.text}>Cargando información...</p>
        </Panel95>
      </section>
    );
  }

  if (error || !sections || sections.length === 0) {
    return (
      <section className={styles.about}>
        <Panel95 variant="raised" className={styles.subsection}>
          <p className={styles.text}>
            {error || 'No hay información disponible en este momento.'}
          </p>
        </Panel95>
      </section>
    );
  }

  return (
    <section className={styles.about}>
      {sections.map((section) => (
        <Panel95 key={section.id} variant="raised" className={styles.subsection}>
          <h2 className={styles.heading}>{section.title}</h2>
          <p className={styles.text}>{section.content}</p>
        </Panel95>
      ))}
    </section>
  );
};

export default About;
