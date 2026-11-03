// Built-in images (inlined into the build). A config value such as
// "builtin:logo" refers to one of these; anything else is treated as an
// uploaded image (data URL).

import logo from '../assets/logo.png';
import qrWhatsapp from '../assets/qr-whatsapp.png';
import qrStripe from '../assets/qr-stripe.png';

const BUILTIN: Record<string, string> = {
  'builtin:logo': logo,
  'builtin:qr-whatsapp': qrWhatsapp,
  'builtin:qr-stripe': qrStripe,
};

export function resolveImage(value: string): string {
  if (!value) return '';
  return BUILTIN[value] ?? value;
}

export const isBuiltin = (value: string) => value.startsWith('builtin:');
