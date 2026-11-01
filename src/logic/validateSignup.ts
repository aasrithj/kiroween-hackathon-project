import { SignupInput, ValidationResult } from '@/types';

export function validateSignup(input: SignupInput): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  // Full name validation
  if (!input.fullName || input.fullName.trim() === '') {
    errors.fullName = 'Name is required';
  } else if (input.fullName.length > 100) {
    errors.fullName = 'Name must be 100 characters or fewer';
  }

  // Email validation
  if (!input.email || input.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (input.email.length > 254) {
    errors.email = 'Email must be 254 characters or fewer';
  } else {
    const atIndex = input.email.indexOf('@');
    if (atIndex < 1 || atIndex === input.email.length - 1) {
      errors.email = 'Please enter a valid email address';
    }
  }

  // Plus-one count validation
  if (input.plusOneCount !== null && input.plusOneCount !== undefined) {
    if (input.plusOneCount < 0 || input.plusOneCount > 10) {
      errors.plusOneCount = 'Plus-one count must be between 0 and 10';
    }
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}
