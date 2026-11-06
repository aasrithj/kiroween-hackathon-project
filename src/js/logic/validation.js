const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{3,}$/;
export function validateName(value) {
  const name = String(value ?? '').trim();

  if (!name) {
    return { valid: false, error: 'nameRequired' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'nameTooLong' };
  }

  return { valid: true, error: null };
}

export function validateEmail(value) {
  const email = String(value ?? '').trim();

  if (email.length > 254 || !emailPattern.test(email)) {
    return { valid: false, error: 'emailInvalid' };
  }

  return { valid: true, error: null };
}

export function validateDetails(details) {
  return {
    name: validateName(details?.name),
    email: validateEmail(details?.email)
  };
}
