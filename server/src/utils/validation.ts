export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePortfolioInput(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'El input de portfolio es requerido' };
  }

  const { title, description, image } = input as Record<string, unknown>;

  if (typeof title !== 'string' || title.length < 1 || title.length > 200) {
    return { valid: false, error: 'El título es requerido y debe tener entre 1 y 200 caracteres' };
  }

  if (typeof description !== 'string' || description.length < 1 || description.length > 2000) {
    return { valid: false, error: 'La descripción es requerida y debe tener entre 1 y 2000 caracteres' };
  }

  if (typeof image !== 'string' || image.length < 1) {
    return { valid: false, error: 'La imagen es requerida' };
  }

  return { valid: true };
}

export function validateServiceInput(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'El input de servicio es requerido' };
  }

  const { title, description, icon } = input as Record<string, unknown>;

  if (typeof title !== 'string' || title.length < 1 || title.length > 200) {
    return { valid: false, error: 'El título es requerido y debe tener entre 1 y 200 caracteres' };
  }

  if (typeof description !== 'string' || description.length < 1 || description.length > 2000) {
    return { valid: false, error: 'La descripción es requerida y debe tener entre 1 y 2000 caracteres' };
  }

  if (typeof icon !== 'string' || icon.length < 1) {
    return { valid: false, error: 'El icono es requerido' };
  }

  return { valid: true };
}

export function validateLoginInput(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Las credenciales son requeridas' };
  }

  const { username, password } = input as Record<string, unknown>;

  if (typeof username !== 'string' || username.length < 1) {
    return { valid: false, error: 'El nombre de usuario es requerido' };
  }

  if (typeof password !== 'string' || password.length < 1) {
    return { valid: false, error: 'La contraseña es requerida' };
  }

  return { valid: true };
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string' || email.includes(' ')) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  return domain.includes('.');
}
