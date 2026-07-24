/**
 * Shared validation logic for Egnaro Mart platform forms
 */

// Basic email validation regex (RFC 5322 approximation)
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Only allows alphabets, spaces, hyphens, and apostrophes
export const NAME_REGEX = /^[A-Za-z\s\-\']+$/;

export function validateEmail(email: string): boolean {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10;
}

export function validatePincode(pin: string): boolean {
  if (!pin) return false;
  const digits = pin.replace(/\D/g, "");
  return digits.length === 6;
}

export function validateName(name: string): boolean {
  if (!name || !name.trim()) return false;
  return NAME_REGEX.test(name.trim());
}

/**
 * Returns an error string if invalid, or null if valid.
 * Requirements: Min 8 chars, 1 uppercase, 1 number.
 */
export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
}

/**
 * Prevents non-numeric characters (e, E, +, -) from being typed into number fields.
 * Useful for price, quantity, stock inputs.
 */
export function preventInvalidNumberInput(e: React.KeyboardEvent<HTMLInputElement>) {
  if (["e", "E", "+", "-"].includes(e.key)) {
    e.preventDefault();
  }
}

export function sanitizeInput(text: string): string {
  if (!text) return "";
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function getGstErrorMessage(gst: string): string | null {
  const cleanGst = gst.trim();
  if (cleanGst === "") return "GSTIN is mandatory.";
  if (cleanGst.length !== 15) return "GSTIN must contain exactly 15 characters.";
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
  if (!gstRegex.test(cleanGst.toUpperCase())) return "Invalid GSTIN format. Please enter a valid GST number.";
  return null;
}

