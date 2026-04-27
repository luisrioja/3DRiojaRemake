import React from 'react';
import { Panel95 } from '../win95/Panel95';
import styles from './About.module.css';

export const About: React.FC = () => {
  return (
    <section className={styles.about}>
      <Panel95 variant="raised" className={styles.subsection}>
        <h2 className={styles.heading}>Impresión 3D Personalizada</h2>
        <p className={styles.text}>
          En 3DRioja ofrecemos un servicio integral de impresión 3D adaptado a tus necesidades.
          Desde prototipos funcionales hasta piezas decorativas, trabajamos con una amplia variedad
          de materiales y tecnologías para dar vida a tus ideas. Nuestro equipo se encarga de todo
          el proceso: diseño, optimización y fabricación, garantizando resultados de alta calidad
          en cada proyecto.
        </p>
      </Panel95>

      <Panel95 variant="raised" className={styles.subsection}>
        <h2 className={styles.heading}>Nuestra Misión</h2>
        <p className={styles.text}>
          Nuestra misión es acercar la tecnología de impresión 3D a particulares, empresas y
          profesionales de La Rioja y toda España. Creemos en la innovación accesible y en el
          poder de la fabricación digital para transformar ideas en realidad. Nos comprometemos
          a ofrecer soluciones creativas, sostenibles y de calidad que impulsen los proyectos
          de nuestros clientes.
        </p>
      </Panel95>
    </section>
  );
};

export default About;
