import '../styles/fonts';
import '../styles/site.css';
import { HADITH, SERVICES, SITE } from '../site/content';
import { loadPublished } from '../site/data';
import { esc, hadith, icon, mountShell } from '../site/layout';
import { renderToday, startCountdown } from '../site/today';

const root = './';
const pub = await loadPublished(root);
const pct = Math.min(100, Math.round((SITE.appeal.raised / SITE.appeal.target) * 100));
const eur = (n: number) => '€' + n.toLocaleString('en-IE');

mountShell(root, '', `
<section class="hero home-hero">
  <div class="wrap hero-grid">
    <div class="hero-text">
      <div class="eyebrow">${esc(SITE.org)} · Limerick</div>
      <h1>${esc(SITE.name)} <span lang="ar">${esc(SITE.arabicName)}</span></h1>
      <p class="lead">${esc(SITE.tagline)}. Daily prayers, Jumu'ah, Quran classes and community services in the heart of Limerick City.</p>
      <div class="actions">
        <a class="btn primary" href="${root}timetable/">${icon('clock')} Prayer timetable</a>
        <a class="btn gold" href="${root}donate/">${icon('heart')} Donate</a>
        <a class="btn ghost" href="${SITE.whatsapp}" target="_blank" rel="noopener">${icon('chat')} WhatsApp group</a>
      </div>
    </div>
    ${renderToday(pub, root)}
  </div>
</section>
${hadith(HADITH.home)}
${SITE.appeal.active ? `
<section class="wrap appeal">
  <div class="appeal-text">
    <div class="eyebrow">Urgent appeal</div>
    <h2>${esc(SITE.appeal.title)}</h2>
    <p>${esc(SITE.appeal.summary)}</p>
    <div class="actions"><a class="btn primary" href="${root}project/">Read about the project ${icon('arrow')}</a><a class="btn gold" href="${SITE.stripe}" target="_blank" rel="noopener">${icon('heart')} Donate now</a></div>
  </div>
  <div class="progress-card">
    <div class="progress-nums"><strong>${eur(SITE.appeal.raised)}</strong><span>raised of ${eur(SITE.appeal.target)}</span></div>
    <div class="progress"><div class="bar" style="width:${pct}%"></div></div>
    <div class="progress-pct">${pct}% of target</div>
  </div>
</section>` : ''}
<section class="wrap">
  <div class="sec-head"><h2>Services & activities</h2><a href="${root}services/">All services ${icon('arrow')}</a></div>
  <div class="cards">${SERVICES.slice(0, 4).map((s) => `<a class="card" href="${root}services/">${icon(s.icon)}<h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></a>`).join('')}</div>
</section>
<section class="wrap visit">
  <div>
    <h2>Visit us</h2>
    <p>${icon('pin')} ${esc(SITE.address)}</p>
    <p>${icon('phone')} <a href="${SITE.phoneHref}">${esc(SITE.phone)}</a></p>
    <a class="btn ghost" href="${root}contact/">Contact & directions ${icon('arrow')}</a>
  </div>
  <iframe class="map" title="Map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(SITE.mapQuery)}&output=embed"></iframe>
</section>
`, { title: 'Home' });

startCountdown(pub);
