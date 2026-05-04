import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Contact } from './Contact';
import { subscribeToNewsletter } from '../../services/api';

vi.mock('../../services/api', () => ({
  subscribeToNewsletter: vi.fn(),
}));

describe('Contact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    expect(link).toHaveAttribute('href', 'https://www.instagram.com/3drioja_/');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders TikTok social link', () => {
    render(<Contact />);
    const link = screen.getByRole('link', { name: 'TikTok' });
    expect(link).toHaveAttribute('href', 'https://www.tiktok.com/@3drioja');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders YouTube social link', () => {
    render(<Contact />);
    const link = screen.getByRole('link', { name: 'YouTube' });
    expect(link).toHaveAttribute('href', 'https://www.youtube.com/@3DRioja');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders the subscription form with email input and submit button', () => {
    render(<Contact />);
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
  });

  it('shows success message on valid email submission', async () => {
    vi.mocked(subscribeToNewsletter).mockResolvedValue({ success: true, data: { id: '1', email: 'test@example.com', subscribedAt: '' } });
    render(<Contact />);
    const input = screen.getByLabelText('Correo electrónico');
    const button = screen.getByRole('button', { name: 'Enviar' });

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('¡Gracias por suscribirte!')).toBeInTheDocument();
    });
    expect(subscribeToNewsletter).toHaveBeenCalledWith('test@example.com');
  });

  it('clears the input after successful submission', async () => {
    vi.mocked(subscribeToNewsletter).mockResolvedValue({ success: true, data: { id: '1', email: 'test@example.com', subscribedAt: '' } });
    render(<Contact />);
    const input = screen.getByLabelText('Correo electrónico');
    const button = screen.getByRole('button', { name: 'Enviar' });

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
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
