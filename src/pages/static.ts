// About, Services, Extension Project, Donate and Contact pages.
// The page is picked from <html data-page="...">.

import '../styles/fonts';
import '../styles/site.css';
import { ABOUT, DONATE, HADITH, PROJECT, SERVICES, SITE } from '../site/content';
import { esc, hadith, hero, icon, mountShell } from '../site/layout';
import { qrSvg } from '../ui/art';

const root = '../';
const page = document.documentElement.dataset.page ?? 'about';
const eur = (n: number) => '€' + n.toLocaleString('en-IE');
const pct = Math.min(100, Math.round((SITE.appeal.raised / SITE.appeal.target) * 100));

const bankBox = `<div class="bank-box">
  <h3>Bank transfer</h3>
  <dl><dt>Bank</dt><dd>${esc(SITE.bank.name)}</dd><dt>IBAN</dt><dd>${esc(SITE.bank.iban)}</dd><dt>BIC</dt><dd>${esc(SITE.bank.bic)}</dd><dt>Name</dt><dd>${esc(SITE.org)}</dd></dl>
</div>`;

const PAGES: Record<string, { title: string; html: string }> = {
  about: {
    title: 'About us',
    html: `${hero('About Al Furqan', SITE.tagline)}${hadith(HADITH.about)}
<section class="wrap prose">${ABOUT.map((p) => `<p>${esc(p)}</p>`).join('')}
<h2>Charity details</h2><p>${esc(SITE.charity.line)}. Revenue Charity No ${esc(SITE.charity.chy)}, Registered Charity Number ${esc(SITE.charity.rcn)}.</p></section>`,
  },
  services: {
    title: 'Services & activities',
    html: `${hero('Services & activities', 'What happens at the masjid')}${hadith(HADITH.services)}
<section class="wrap"><div class="cards">${SERVICES.map((s) => `<div class="card">${icon(s.icon)}<h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join('')}</div>
<p class="muted center">Times and registration details are announced in the <a href="${SITE.whatsapp}" target="_blank" rel="noopener">WhatsApp community group</a>.</p></section>`,
  },
  project: {
    title: 'Mosque extension project',
    html: `${hero(SITE.appeal.title, 'Help us raise €600,000 to expand our place of worship')}
<section class="wrap appeal">
  <div class="appeal-text prose"><p class="quote">${esc(PROJECT.intro)}</p><p>${esc(PROJECT.appeal)}</p>
    <h2>Why this expansion is crucial</h2><ul class="checks">${PROJECT.why.map(([t, d]) => `<li><strong>${esc(t)}</strong> ${esc(d)}</li>`).join('')}</ul>
    <h2>How you can help</h2><p>${esc(PROJECT.how)}</p>
    <div class="actions"><a class="btn gold" href="${SITE.stripe}" target="_blank" rel="noopener">${icon('heart')} Donate online</a><a class="btn ghost" href="${root}donate/">Other ways to donate ${icon('arrow')}</a></div>
  </div>
  <div><div class="progress-card"><div class="progress-nums"><strong>${eur(SITE.appeal.raised)}</strong><span>raised of ${eur(SITE.appeal.target)}</span></div><div class="progress"><div class="bar" style="width:${pct}%"></div></div><div class="progress-pct">${pct}% of target</div></div>${bankBox}</div>
</section>`,
  },
  donate: {
    title: 'Donate',
    html: `${hero('Support Masjid Al-Furqan', 'Your generosity, our strength')}${hadith(HADITH.donate)}
<section class="wrap donate-grid">
  <div class="prose"><p>${esc(DONATE.intro)}</p>
    <h2>Why your donation matters</h2><ul class="checks">${DONATE.why.map(([t, d]) => `<li><strong>${esc(t)}</strong> ${esc(d)}</li>`).join('')}</ul>
    <h2>Ways to donate</h2><ul class="checks">${DONATE.ways.map(([t, d]) => `<li><strong>${esc(t)}</strong> ${esc(d)}</li>`).join('')}</ul>
  </div>
  <aside class="donate-side">
    <a class="btn gold big" href="${SITE.stripe}" target="_blank" rel="noopener">${icon('heart')} Donate online (card)</a>
    ${bankBox}
    <div class="qr-box"><div class="qr-svg">${qrSvg(SITE.stripe)}</div><p>Scan to donate online</p></div>
  </aside>
</section>`,
  },
  contact: {
    title: 'Contact',
    html: `${hero('Contact & directions', 'We would love to hear from you')}
<section class="wrap contact-grid">
  <div class="prose">
    <p>${icon('pin')} <strong>Address</strong><br>${esc(SITE.address)}</p>
    <p>${icon('phone')} <strong>Phone</strong><br><a href="${SITE.phoneHref}">${esc(SITE.phone)}</a></p>
    ${SITE.email ? `<p>${icon('mail')} <strong>Email</strong><br><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></p>` : ''}
    <p>${icon('chat')} <strong>WhatsApp</strong><br><a href="${SITE.whatsapp}" target="_blank" rel="noopener">Join the community group</a> for announcements.</p>
    <div class="qr-box small"><div class="qr-svg">${qrSvg(SITE.whatsapp)}</div><p>Scan to join the WhatsApp group</p></div>
  </div>
  <iframe class="map tall" title="Map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(SITE.mapQuery)}&output=embed"></iframe>
</section>`,
  },
};

const p = PAGES[page] ?? PAGES.about;
mountShell(root, `${page}/`, p.html, { title: p.title });
