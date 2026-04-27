import React from 'react';
import type { Testimonial } from '../../types';
import { Panel95 } from '../win95/Panel95';
import styles from './Testimonials.module.css';

const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/bZ4gzWByAZX1cp2Y7';

export interface TestimonialsProps {
  testimonials: Testimonial[];
  loading?: boolean;
  error?: string | null;
  isCached?: boolean;
}

function renderStars(rating: number): string {
  const clamped = Math.max(1, Math.min(5, Math.round(rating)));
  return '★'.repeat(clamped) + '☆'.repeat(5 - clamped);
}

export const Testimonials: React.FC<TestimonialsProps> = ({
  testimonials,
  loading = false,
  error = null,
  isCached = false,
}) => {
  return (
    <section className={styles.testimonials}>
      <h2 className={styles.heading}>Testimonios</h2>

      {loading && (
        <Panel95 variant="sunken">
          <p className={styles.loading}>Cargando testimonios...</p>
        </Panel95>
      )}

      {error && (
        <Panel95 variant="sunken">
          <p className={styles.error}>{error}</p>
        </Panel95>
      )}

      {!loading && !error && (
        <>
          {isCached && (
            <p className={styles.cachedMessage}>
              Mostrando reseñas almacenadas recientemente
            </p>
          )}

          <div className={styles.grid}>
            {testimonials.map((testimonial) => (
              <Panel95 key={testimonial.id} variant="raised" className={styles.card}>
                <h3 className={styles.author}>{testimonial.author}</h3>
                <span className={styles.stars} aria-label={`${Math.max(1, Math.min(5, Math.round(testimonial.rating)))} de 5 estrellas`}>
                  {renderStars(testimonial.rating)}
                </span>
                <p className={styles.text}>{testimonial.text}</p>
                <p className={styles.date}>{testimonial.date}</p>
              </Panel95>
            ))}
          </div>

          <a
            className={styles.mapsLink}
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver todas las reseñas en Google Maps
          </a>
        </>
      )}
    </section>
  );
};

export default Testimonials;
