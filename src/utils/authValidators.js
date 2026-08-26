/**
 * Funções de validação de autenticação (Email e Regras de Senha Forte).
 */

export const isValidEmail = (val) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
};

export const checkPasswordStrength = (password = '') => {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

  const missingRules = [];
  if (!hasMinLength) missingRules.push('mínimo 8 caracteres');
  if (!hasUpper) missingRules.push('1 letra maiúscula');
  if (!hasLower) missingRules.push('1 letra minúscula');
  if (!hasNumber) missingRules.push('1 número');
  if (!hasSpecial) missingRules.push('1 caractere especial (!@#$...)');

  return {
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    isValid: missingRules.length === 0,
    missingRules
  };
};
