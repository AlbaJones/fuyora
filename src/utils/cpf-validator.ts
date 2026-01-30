/**
 * CPF (Cadastro de Pessoas Físicas) Validator
 * Brazilian tax identification number validation
 */

export interface CpfValidationResult {
  valid: boolean;
  formatted?: string;
  error?: string;
}

/**
 * Removes non-numeric characters from CPF
 */
function cleanCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

/**
 * Formats CPF to ###.###.###-##
 */
export function formatCpf(cpf: string): string {
  const cleaned = cleanCpf(cpf);
  if (cleaned.length !== 11) {
    return cpf;
  }
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Validates CPF format and checksum
 */
export function validateCpf(cpf: string): CpfValidationResult {
  // Remove formatting
  const cleaned = cleanCpf(cpf);

  // Check length
  if (cleaned.length !== 11) {
    return {
      valid: false,
      error: "CPF must have 11 digits",
    };
  }

  // Check if all digits are the same (invalid CPFs like 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return {
      valid: false,
      error: "CPF cannot have all identical digits",
    };
  }

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) {
    checkDigit = 0;
  }
  if (checkDigit !== parseInt(cleaned.charAt(9))) {
    return {
      valid: false,
      error: "Invalid CPF checksum (first digit)",
    };
  }

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) {
    checkDigit = 0;
  }
  if (checkDigit !== parseInt(cleaned.charAt(10))) {
    return {
      valid: false,
      error: "Invalid CPF checksum (second digit)",
    };
  }

  // CPF is valid
  return {
    valid: true,
    formatted: formatCpf(cleaned),
  };
}

/**
 * Check if CPF is valid (returns boolean)
 */
export function isValidCpf(cpf: string): boolean {
  return validateCpf(cpf).valid;
}
