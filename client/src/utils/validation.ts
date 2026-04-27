export function isValidEmail(email: string): boolean {
  if (!email || email.includes(' ')) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  return domain.includes('.');
}
