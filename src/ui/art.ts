// Visual assets drawn in code: geometric pattern, placeholder emblem, QR code.

import qrcode from 'qrcode-generator';

const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** Eight-pointed star (khatam) lattice, used as a subtle background. */
export function starPattern(color: string, opacity = 0.35, size = 56): string {
  const s = size;
  const h = s / 2;
  const q = s * 0.22;
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
<g fill="none" stroke="${color}" stroke-width="1" opacity="${opacity}">
<rect x="${h - q}" y="${h - q}" width="${2 * q}" height="${2 * q}"/>
<rect x="${h - q}" y="${h - q}" width="${2 * q}" height="${2 * q}" transform="rotate(45 ${h} ${h})"/>
<circle cx="${h}" cy="${h}" r="${q * 0.45}"/>
<path d="M0 0L${h - q} ${h - q}M${s} 0L${h + q} ${h - q}M0 ${s}L${h - q} ${h + q}M${s} ${s}L${h + q} ${h + q}"/>
<path d="M${h} 0V${h - q * 1.41}M${h} ${s}V${h + q * 1.41}M0 ${h}H${h - q * 1.41}M${s} ${h}H${h + q * 1.41}"/>
</g></svg>`);
}

/** Small eight-pointed star used as an ornament. */
export function starGlyph(color: string, size = 14): string {
  const h = size / 2;
  const r = size * 0.36;
  return `<svg class="star" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
<g fill="${color}"><rect x="${h - r}" y="${h - r}" width="${2 * r}" height="${2 * r}"/>
<rect x="${h - r}" y="${h - r}" width="${2 * r}" height="${2 * r}" transform="rotate(45 ${h} ${h})"/></g></svg>`;
}

/** Placeholder emblem (dome, minarets and crescent) until a logo is uploaded. */
export function defaultEmblem(): string {
  return `<svg viewBox="0 0 100 100" class="emblem" role="img" aria-label="Masjid emblem">
<circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" stroke-width="2.5"/>
<circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/>
<g fill="currentColor">
<path d="M50 22c1.6 0 2.6 1 2.6 1s-2.3-.1-3.6 1.6c-1.3 1.8-.8 4.2 1 5.4 1.8 1.2 4 .6 4 .6s-1.4 1.6-4 1.4c-3.3-.3-5.4-3.2-4.9-6.2.4-2.4 2.6-3.8 4.9-3.8z"/>
<path d="M50 34c-9 0-17 7-17 17h34c0-10-8-17-17-17z"/>
<rect x="31" y="52" width="38" height="20" rx="1"/>
<path d="M45 72v-9a5 5 0 0 1 10 0v9z" fill="#0000" stroke="currentColor"/>
<rect x="21" y="40" width="5" height="32" rx="1"/><path d="M23.5 32l3 8h-6z"/>
<rect x="74" y="40" width="5" height="32" rx="1"/><path d="M76.5 32l3 8h-6z"/>
<rect x="18" y="72" width="64" height="4" rx="1"/>
</g></svg>`;
}

/**
 * Corner ornament for the page frame: a quarter arabesque of arcs, an
 * eight-pointed star and a trefoil, drawn in gold line-work.
 */
export function cornerOrnament(color: string): string {
  return `<svg class="corner" viewBox="0 0 100 100" aria-hidden="true">
<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round">
<path d="M2 60C2 28 28 2 60 2"/>
<path d="M2 78C2 36 36 2 78 2" stroke-width="1" opacity=".7"/>
<path d="M14 42c6-16 12-22 28-28" stroke-width="1.2"/>
<path d="M60 2c-6 10-6 18 0 26M2 60c10-6 18-6 26 0" stroke-width="1.2"/>
<circle cx="30" cy="30" r="7"/>
</g>
<g fill="${color}">
<rect x="25" y="25" width="10" height="10"/>
<rect x="25" y="25" width="10" height="10" transform="rotate(45 30 30)"/>
<circle cx="60" cy="28" r="2.2"/><circle cx="28" cy="60" r="2.2"/><circle cx="78" cy="2" r="1.6"/><circle cx="2" cy="78" r="1.6"/>
</g></svg>`;
}

/** QR code as an inline SVG string (empty string if no text). */
export function qrSvg(text: string): string {
  if (!text.trim()) return '';
  const qr = qrcode(0, 'M');
  qr.addData(text.trim());
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
}
