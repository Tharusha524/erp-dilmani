export const PASSWORD_POLICY = {
  minLength: 8,
  requireLetter: true,
  requireNumber: true,
  maxLength: 128,
} as const;

export interface PasswordPolicyCheck {
  id: string;
  label: string;
  passed: boolean;
}

export function getPasswordPolicyChecks(password: string): PasswordPolicyCheck[] {
  return [
    {
      id: "length",
      label: `At least ${PASSWORD_POLICY.minLength} characters`,
      passed: password.length >= PASSWORD_POLICY.minLength,
    },
    {
      id: "letter",
      label: "Contains at least one letter",
      passed: /[A-Za-z]/.test(password),
    },
    {
      id: "number",
      label: "Contains at least one number",
      passed: /\d/.test(password),
    },
  ];
}

export function getPasswordPolicySummary(): string {
  return `Password must be at least ${PASSWORD_POLICY.minLength} characters and include letters and numbers.`;
}

export function validatePassword(
  password: string,
  options?: { required?: boolean }
): string | null {
  const required = options?.required ?? true;

  if (!password) {
    return required ? "Password is required" : null;
  }

  if (password.length > PASSWORD_POLICY.maxLength) {
    return `Password cannot exceed ${PASSWORD_POLICY.maxLength} characters`;
  }

  const checks = getPasswordPolicyChecks(password);
  const failed = checks.find((check) => !check.passed);

  return failed ? failed.label : null;
}

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*?_-";

function randomChar(pool: string): string {
  const index = crypto.getRandomValues(new Uint32Array(1))[0] % pool.length;
  return pool[index] ?? pool[0];
}

function shuffle(values: string[]): string[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Generate a strong random password that satisfies the default policy. */
export function generateStrongPassword(length = 14): string {
  const size = Math.max(length, PASSWORD_POLICY.minLength, 12);
  const required = [
    randomChar(UPPER),
    randomChar(LOWER),
    randomChar(DIGITS),
    randomChar(SYMBOLS),
  ];
  const all = UPPER + LOWER + DIGITS + SYMBOLS;

  while (required.length < size) {
    required.push(randomChar(all));
  }

  return shuffle(required).join("");
}
