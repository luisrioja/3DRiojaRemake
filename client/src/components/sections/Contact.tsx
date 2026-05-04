import React, { useState } from 'react';
import { Panel95 } from '../win95/Panel95';
import { Button95 } from '../win95/Button95';
import { subscribeToNewsletter } from '../../services/api';
import styles from './Contact.module.css';

/** Simple inline email validation (full isValidEmail in task 8.10) */
function validateEmail(email: string): boolean {
  if (!email || email.includes(' ')) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  return domain.includes('.');
}

export const Contact: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateEmail(email)) {
      setLoading(true);
      const res = await subscribeToNewsletter(email);
      if (res.success) {
        setMessage({ type: 'success', text: '¡Gracias por suscribirte!' });
        setEmail('');
      } else {
        setMessage({ type: 'error', text: res.error ?? 'Error al suscribirse' });
      }
      setLoading(false);
    } else {
      setMessage({ type: 'error', text: 'El formato de correo electrónico es incorrecto' });
    }
  };

  return (
    <section className={styles.contact}>
      <Panel95 variant="raised" className={styles.subsection}>
        <h2 className={styles.heading}>Contacto</h2>
        <p className={styles.text}>
          ¿Tienes un proyecto en mente? Escríbenos y te ayudamos a hacerlo realidad.
        </p>
        <p className={styles.text}>
          Email:{' '}
          <a href="mailto:3drioja@gmail.com" className={styles.emailLink}>
            3drioja@gmail.com
          </a>
        </p>
      </Panel95>

      <Panel95 variant="raised" className={styles.subsection}>
        <h3 className={styles.subheading}>Síguenos</h3>
        <div className={styles.socialLinks}>
          <a
            href="https://www.instagram.com/3drioja_/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
          >
            Instagram
          </a>
          <a
            href="https://www.tiktok.com/@3drioja"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
          >
            TikTok
          </a>
          <a
            href="https://www.youtube.com/@3DRioja"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialLink}
          >
            YouTube
          </a>
        </div>
      </Panel95>

      <Panel95 variant="raised" className={styles.subsection}>
        <h3 className={styles.subheading}>Suscríbete a nuestra newsletter</h3>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputRow}>
            <input
              type="text"
              className={styles.emailInput}
              placeholder="tu@email.com"
              value={email}
              disabled={loading}
              onChange={(e) => {
                setEmail(e.target.value);
                setMessage(null);
              }}
              aria-label="Correo electrónico"
            />
            <Button95 type="submit" disabled={loading}>
              {loading ? '...' : 'Enviar'}
            </Button95>
          </div>
          {message && (
            <p className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
              {message.text}
            </p>
          )}
        </form>
      </Panel95>
    </section>
  );
};

export default Contact;
