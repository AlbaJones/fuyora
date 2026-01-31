import { z } from 'zod';

// Login validation
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// CPF validation helper
const validateCPF = (cpf: string): boolean => {
  // Remove non-digits
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Check length
  if (cleanCPF.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

// Register validation (simplified - no role, no CPF)
export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  username: z.string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(20, 'Username deve ter no máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e _'),
  full_name: z.string().min(3, 'Nome completo deve ter pelo menos 3 caracteres'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// KYC validation (with CPF - used in KYC form, not registration)
export const kycSchema = z.object({
  cpf: z.string().refine(validateCPF, {
    message: 'CPF inválido',
  }),
  full_address: z.object({
    line: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
    city: z.string().min(2, 'Cidade inválida'),
    state: z.string().length(2, 'Estado deve ter 2 letras'),
    zip: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
    country: z.string().default('BR'),
  }),
});

export type KYCFormData = z.infer<typeof kycSchema>;

// Product creation validation
export const productSchema = z.object({
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  description: z.string().min(20, 'Descrição deve ter pelo menos 20 caracteres'),
  price: z.number().positive('Preço deve ser maior que zero'),
  category: z.string().min(1, 'Selecione uma categoria'),
  digital_product: z.boolean(),
  file_url: z.string().url().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// Review validation
export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Comentário deve ter pelo menos 10 caracteres').optional(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
