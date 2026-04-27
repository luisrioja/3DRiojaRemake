import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Contact } from './Contact';

describe('Contact', () => {
  it('renders the "Contacto" heading', () => {
    render(<Contact />);
    expect(
      screen.getByRole('heading', { name: 'Contacto' })
    ).toBeInTheDocument();
  });

  it('renders the email as a mailto link', () => {
    render(<Contact />);
    const emailLink = screen.getByRole('link', { name: '3drioja@gmail.com' });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', 'mailto:3drioja@gmail.com');
  });

  it('renders Instagram social link', () => {
    render(<Contact />);
    const link = screen.getByRole('link', { name: 'Instagram' });
    expect(link).toHaveAttribute('href', 'https://instagram.com/3drioja');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders TikTok social link', () => {
    render(<Contact />);
    const link = screen.getByRole('link', { name: 'TikTok' });
    expect(link).toHaveAttribute('href', 'https://tiktok.com/@3drioja');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders Twitter/X social link', () => {
    render(<Contact />);
    const link = screen.getByRole('link', { name: 'Twitter/X' });
    expect(link).toHaveAttribute('href', 'https://x.com/3drioja');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders the subscription form with email input and submit button', () => {
    render(<Contact />);
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
  });

  it('shows success message on valid email submission', () => {
    render(<Contact />);
    const input = screen.getByLabelText('Correo electrónico');
    const button = screen.getByRole('button', { name: 'Enviar' });

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(button);

    expect(screen.getByText('¡Gracias por suscribirte!')).toBeInTheDocument();
  });

  it('clears the input after successful submission', () => {
    render(<Contact />);
    const input = screen.getByLabelText('Correo electrónico');
    const button = screen.getByRole('button', { name: 'Enviar' });

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(button);

    expect(input).toHaveValue('');
  });

  it('shows error message on invalid email submission', () => {
    render(<Contact />);
    const input = screen.getByLabelText('Correo electrónico');
    const button = screen.getByRole('button', { name: 'Enviar' });

    fireEvent.change(input, { target: { value: 'invalid-email' } });
    fireEvent.click(button);

    expect(
      screen.getByText('El formato de correo electrónico es incorrecto')
    ).toBeInTheDocument();
  });

  it('shows error for email with spaces', () => {
    render(<Contact />);
    const input = screen.getByLabelText('Correo electrónico');
    const button = screen.getByRole('button', { name: 'Enviar' });

    fireEvent.change(input, { target: { value: 'test @example.com' } });
    fireEvent.click(button);

    expect(
      screen.getByText('El formato de correo electrónico es incorrecto')
    ).toBeInTheDocument();
  });

  it('shows error for empty email submission', () => {
    render(<Contact />);
    const button = screen.getByRole('button', { name: 'Enviar' });

    fireEvent.click(button);

    expect(
      screen.getByText('El formato de correo electrónico es incorrecto')
    ).toBeInTheDocument();
  });

  it('clears message when user types in the input', () => {
    render(<Contact />);
    const input = screen.getByLabelText('Correo electrónico');
    const button = screen.getByRole('button', { name: 'Enviar' });

    fireEvent.change(input, { target: { value: 'bad' } });
    fireEvent.click(button);
    expect(
      screen.getByText('El formato de correo electrónico es incorrecto')
    ).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'b' } });
    expect(
      screen.queryByText('El formato de correo electrónico es incorrecto')
    ).not.toBeInTheDocument();
  });
});
