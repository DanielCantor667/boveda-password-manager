const crypto = require('node:crypto');

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

function generatePassword(length = 20, options = {}) {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeDigits = true,
    includeSymbols = true
  } = options;

  let charset = '';
  if (includeLowercase) charset += LOWERCASE;
  if (includeUppercase) charset += UPPERCASE;
  if (includeDigits) charset += DIGITS;
  if (includeSymbols) charset += SYMBOLS;

  if (!charset) return '';

  const bytes = crypto.randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }

  return password;
}

module.exports = { generatePassword };
