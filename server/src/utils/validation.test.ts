import { describe, it, expect } from 'vitest';
import {
  validatePortfolioInput,
  validateServiceInput,
  validateLoginInput,
  isValidEmail,
} from './validation';

describe('validatePortfolioInput', () => {
  it('acepta input válido', () => {
    const result = validatePortfolioInput({
      title: 'Proyecto 3D',
      description: 'Una descripción del proyecto',
      image: '/images/proyecto.jpg',
    });
    expect(result).toEqual({ valid: true });
  });

  it('rechaza input null', () => {
    const result = validatePortfolioInput(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rechaza input undefined', () => {
    const result = validatePortfolioInput(undefined);
    expect(result.valid).toBe(false);
  });

  it('rechaza título vacío', () => {
    const result = validatePortfolioInput({ title: '', description: 'desc', image: 'img.jpg' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('título');
  });

  it('rechaza título mayor a 200 caracteres', () => {
    const result = validatePortfolioInput({
      title: 'a'.repeat(201),
      description: 'desc',
      image: 'img.jpg',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('título');
  });

  it('acepta título de exactamente 200 caracteres', () => {
    const result = validatePortfolioInput({
      title: 'a'.repeat(200),
      description: 'desc',
      image: 'img.jpg',
    });
    expect(result.valid).toBe(true);
  });

  it('rechaza descripción vacía', () => {
    const result = validatePortfolioInput({ title: 'Título', description: '', image: 'img.jpg' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('descripción');
  });

  it('rechaza descripción mayor a 2000 caracteres', () => {
    const result = validatePortfolioInput({
      title: 'Título',
      description: 'a'.repeat(2001),
      image: 'img.jpg',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('descripción');
  });

  it('rechaza imagen faltante', () => {
    const result = validatePortfolioInput({ title: 'Título', description: 'desc' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('imagen');
  });

  it('rechaza imagen vacía', () => {
    const result = validatePortfolioInput({ title: 'Título', description: 'desc', image: '' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('imagen');
  });

  it('rechaza título no string', () => {
    const result = validatePortfolioInput({ title: 123, description: 'desc', image: 'img.jpg' });
    expect(result.valid).toBe(false);
  });
});

describe('validateServiceInput', () => {
  it('acepta input válido', () => {
    const result = validateServiceInput({
      title: 'Impresión 3D',
      description: 'Servicio de impresión',
      icon: 'printer-3d',
    });
    expect(result).toEqual({ valid: true });
  });

  it('rechaza input null', () => {
    const result = validateServiceInput(null);
    expect(result.valid).toBe(false);
  });

  it('rechaza título vacío', () => {
    const result = validateServiceInput({ title: '', description: 'desc', icon: 'icon' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('título');
  });

  it('rechaza título mayor a 200 caracteres', () => {
    const result = validateServiceInput({
      title: 'a'.repeat(201),
      description: 'desc',
      icon: 'icon',
    });
    expect(result.valid).toBe(false);
  });

  it('rechaza descripción vacía', () => {
    const result = validateServiceInput({ title: 'Título', description: '', icon: 'icon' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('descripción');
  });

  it('rechaza descripción mayor a 2000 caracteres', () => {
    const result = validateServiceInput({
      title: 'Título',
      description: 'a'.repeat(2001),
      icon: 'icon',
    });
    expect(result.valid).toBe(false);
  });

  it('rechaza icono faltante', () => {
    const result = validateServiceInput({ title: 'Título', description: 'desc' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('icono');
  });

  it('rechaza icono vacío', () => {
    const result = validateServiceInput({ title: 'Título', description: 'desc', icon: '' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('icono');
  });
});

describe('validateLoginInput', () => {
  it('acepta credenciales válidas', () => {
    const result = validateLoginInput({ username: 'admin', password: 'secret' });
    expect(result).toEqual({ valid: true });
  });

  it('rechaza input null', () => {
    const result = validateLoginInput(null);
    expect(result.valid).toBe(false);
  });

  it('rechaza username vacío', () => {
    const result = validateLoginInput({ username: '', password: 'secret' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('usuario');
  });

  it('rechaza password vacío', () => {
    const result = validateLoginInput({ username: 'admin', password: '' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('contraseña');
  });

  it('rechaza username faltante', () => {
    const result = validateLoginInput({ password: 'secret' });
    expect(result.valid).toBe(false);
  });

  it('rechaza password faltante', () => {
    const result = validateLoginInput({ username: 'admin' });
    expect(result.valid).toBe(false);
  });

  it('rechaza username no string', () => {
    const result = validateLoginInput({ username: 42, password: 'secret' });
    expect(result.valid).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('acepta email válido simple', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('acepta email con subdominio', () => {
    expect(isValidEmail('user@mail.example.com')).toBe(true);
  });

  it('rechaza cadena vacía', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rechaza cadena sin @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('rechaza cadena con múltiples @', () => {
    expect(isValidEmail('user@@example.com')).toBe(false);
  });

  it('rechaza email con espacios', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });

  it('rechaza dominio sin punto', () => {
    expect(isValidEmail('user@localhost')).toBe(false);
  });

  it('rechaza email sin parte local', () => {
    expect(isValidEmail('@example.com')).toBe(false);
  });

  it('rechaza email sin dominio', () => {
    expect(isValidEmail('user@')).toBe(false);
  });
});
