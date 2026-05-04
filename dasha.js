// Vimshottari Dasha engine.
// Computes the full 120-year planetary period sequence from the birth Moon's nakshatra,
// including Mahadasha, Antardasha (Bhukti), and Pratyantar Dasha for the current period.
// All dates are JS Date objects (midnight local interpretation; comparisons use ms values).

const DASHA_YEARS = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17
};

// Fixed dasha sequence (repeats every 120 years)
const DASHA_SEQ = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];

const TOTAL_YEARS = 120;
const DAYS_PER_YEAR = 365.25;

// Nakshatra lord for each of the 27 nakshatras (index 0-26) — repeating the 9-planet sequence 3 times.
const NAK_LORD = [
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury',
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury',
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'
];

// NAK_SPAN (360/27) is defined in interpret.js; do not re-declare here.

// Add a fractional number of years to a Date, returning a new Date.
function addYears(date, years) {
  return new Date(date.getTime() + years * DAYS_PER_YEAR * 86400000);
}

// Format a Date as "DD Mon YYYY"
function fmtDate(d) {
  if (!d || isNaN(d)) return '—';
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

// Format a duration in fractional years as "X yrs Y mos Z days"
function fmtDuration(years) {
  const totalDays = Math.round(years * DAYS_PER_YEAR);
  const y = Math.floor(totalDays / 365);
  const rem = totalDays - y * 365;
  const m = Math.floor(rem / 30);
  const d = rem - m * 30;
  const parts = [];
  if (y) parts.push(y + ' yr' + (y > 1 ? 's' : ''));
  if (m) parts.push(m + ' mo' + (m > 1 ? 's' : ''));
  if (d && !y) parts.push(d + ' day' + (d > 1 ? 's' : ''));
  return parts.join(' ') || '<1 day';
}

// ── Mahadasha characterisations ──
const MD_TEXT = {
  Ketu:    'Ketu Mahadasha (7 years) is a period of spiritualisation and letting go. Material attachments loosen; hidden talents surface. Periods of withdrawal and introspection alternate with sudden, karmically significant events. This is a time to deepen meditation, simplify life, and resolve old karmas. Success comes through detachment rather than grasping.',
  Venus:   'Venus Mahadasha (20 years) is the longest and often the most pleasurable period. Relationships, creativity, beauty, wealth, and sensory delight are all highlighted. Favourable for marriage, the arts, business, and material prosperity. Spiritual progress is also possible through devotion (Bhakti). Caution against overindulgence.',
  Sun:     'Sun Mahadasha (6 years) brings matters of authority, recognition, self-expression, and father/government relationships to the forefront. A time to step into leadership, assert your dharma, and take your rightful place. Career advancement is often marked. Ego challenges arise to be transcended through humility and service.',
  Moon:    'Moon Mahadasha (10 years) heightens emotional sensitivity, intuition, and the domestic sphere. The mind and mood fluctuate like the tides. Relationships with mother, women, and the public are emphasised. Travel, fluid situations, and a strong pull toward home and roots. Nourishment — physical and emotional — is the theme.',
  Mars:    'Mars Mahadasha (7 years) brings energy, courage, drive, and the will to act. A time of assertiveness, physical vitality, and pushing past obstacles. Ambitions are pursued vigorously. Conflicts and accidents require caution; channel Mars energy into disciplined effort, sports, and protective action for others.',
  Rahu:    'Rahu Mahadasha (18 years) is a period of worldly ambition, restless expansion, and unconventional experience. Sudden rises (and falls) are possible. Foreign connections, technology, and breaking of old patterns are themes. The shadow-planet magnifies both desire and confusion. Spiritual grounding is the essential counterbalance.',
  Jupiter: 'Jupiter Mahadasha (16 years) is considered the most auspicious period in Jyotish. Wisdom, expansion, grace, children, higher learning, spirituality, and genuine prosperity all blossom. Teachers and blessings arrive. What you plant during Guru\'s period bears fruit for decades. Generosity attracts abundance.',
  Saturn:  'Saturn Mahadasha (19 years) is the great period of effort, discipline, and karmic rebalancing. Work, responsibility, and service become the central themes. Progress is slow but enduring — what is built now stands for a lifetime. Obstacles are teachers; patience and perseverance are the practices. Shani rewards those who persist.',
  Mercury: 'Mercury Mahadasha (17 years) activates the mind, communication, commerce, education, and skill. Writing, speaking, trading, learning, and networking thrive. Multiple projects run simultaneously. A time to sharpen the intellect, build professional networks, and pursue knowledge systematically. Curiosity becomes your greatest asset.'
};

// Brief Antardasha modifier describing how the sub-lord colours the Mahadasha.
const AD_MOD = {
  Ketu:    'Ketu sub-period introduces an undercurrent of spiritual detachment, sudden turns, and karmic releases within the broader Mahadasha theme.',
  Venus:   'Venus sub-period softens and beautifies — relationships, pleasures, and creative or financial gains colour the Mahadasha energy.',
  Sun:     'Sun sub-period brings authority, clarity, and self-assertion — matters of status, health, and the father figure become significant.',
  Moon:    'Moon sub-period heightens emotional sensitivity and fluctuation — home, mother, travel, and the inner world come to the fore.',
  Mars:    'Mars sub-period energises and activates — courage, conflict, physical activity, and decisive action characterise this sub-period.',
  Rahu:    'Rahu sub-period amplifies ambition and unpredictability — foreign elements, sudden changes, and intensified worldly desire are possible.',
  Jupiter: 'Jupiter sub-period brings grace, opportunity, and expansion — blessings, teachers, children, and spiritual insight mark this phase.',
  Saturn:  'Saturn sub-period calls for patience, hard work, and discipline — delays are teachers; karma is worked through methodically.',
  Mercury: 'Mercury sub-period sharpens the intellect — communication, commerce, learning, and networking become the daily focus.'
};

// ── Core calculation ──

// Build the full Mahadasha sequence starting from the birth Moon position.
// Returns an array of Mahadasha objects, each with:
//   { lord, startDate, endDate, years, isCurrent, antardashas[] }
// Covers birth → birth + 120 years, but we only return those overlapping
// birth ± 80 years for display (to keep the list manageable).
function computeDashas(moonSiderealLon, birthDate) {
  const lon    = ((moonSiderealLon % 360) + 360) % 360;
  const nakIdx = Math.floor(lon / NAK_SPAN);
  const posInNak = lon - nakIdx * NAK_SPAN;        // 0 .. 13.333°
  const fracElapsed = posInNak / NAK_SPAN;         // 0..1, fraction of nakshatra traversed
  const birthLord   = NAK_LORD[nakIdx];

  // Index of birth lord within DASHA_SEQ
  const birthSeqIdx = DASHA_SEQ.indexOf(birthLord);

  // How many years of the first Mahadasha remain at birth
  const firstYearsTotal   = DASHA_YEARS[birthLord];
  const firstYearsElapsed = fracElapsed * firstYearsTotal;
  const firstYearsRemain  = firstYearsTotal - firstYearsElapsed;

  // Start date of the first Mahadasha (before birth)
  const firstStart = addYears(birthDate, -firstYearsElapsed);

  const today = new Date();
  const dashas = [];

  let cursor = firstStart;
  let seqIdx = birthSeqIdx;
  let firstDasha = true;

  // Generate enough dashas to cover birth + ~120 years
  for (let i = 0; i < 18; i++) {
    const lord = DASHA_SEQ[seqIdx % 9];
    const years = firstDasha ? firstYearsTotal : DASHA_YEARS[lord];
    const yrs   = firstDasha ? firstYearsRemain + firstYearsElapsed : years;

    const startDate = cursor;
    const endDate   = firstDasha
      ? addYears(firstStart, firstYearsTotal)
      : addYears(cursor, years);

    const isCurrent = today >= startDate && today < endDate;

    // Compute Antardashas for this Mahadasha
    const antardashas = computeAntardashas(lord, startDate, years, today);

    dashas.push({ lord, startDate, endDate, years: firstDasha ? firstYearsTotal : years, isCurrent, antardashas, firstYearsRemain: firstDasha ? firstYearsRemain : null });

    cursor = endDate;
    seqIdx++;
    firstDasha = false;

    // Stop once we are well past today and have the next 2 full dashas
    if (!isCurrent && cursor > today && dashas.filter(d => d.startDate > today).length >= 2) break;
  }

  return { dashas, nakIdx, nakLord: birthLord, fracElapsed, birthLord };
}

// Compute Antardashas for a Mahadasha.
function computeAntardashas(mahaLord, mahaStart, mahaYears, today) {
  const seqStart = DASHA_SEQ.indexOf(mahaLord);
  const antardashas = [];
  let cursor = mahaStart;

  for (let i = 0; i < 9; i++) {
    const antaLord = DASHA_SEQ[(seqStart + i) % 9];
    const antaYears = mahaYears * DASHA_YEARS[antaLord] / TOTAL_YEARS;
    const startDate = cursor;
    const endDate   = addYears(cursor, antaYears);
    const isCurrent = today >= startDate && today < endDate;

    // Pratyantar for the current Antardasha only
    const pratyantars = isCurrent
      ? computePratyantars(mahaLord, antaLord, startDate, antaYears, today)
      : [];

    antardashas.push({ lord: antaLord, startDate, endDate, years: antaYears, isCurrent, pratyantars });
    cursor = endDate;
  }
  return antardashas;
}

// Compute Pratyantar Dashas for the current Antardasha.
function computePratyantars(mahaLord, antaLord, antaStart, antaYears, today) {
  const seqStart = DASHA_SEQ.indexOf(antaLord);
  const pratyantars = [];
  let cursor = antaStart;

  for (let i = 0; i < 9; i++) {
    const pratLord = DASHA_SEQ[(seqStart + i) % 9];
    const pratYears = antaYears * DASHA_YEARS[pratLord] / TOTAL_YEARS;
    const startDate = cursor;
    const endDate   = addYears(cursor, pratYears);
    const isCurrent = today >= startDate && today < endDate;
    pratyantars.push({ lord: pratLord, startDate, endDate, years: pratYears, isCurrent });
    cursor = endDate;
  }
  return pratyantars;
}

// Find the current Mahadasha and Antardasha objects from a dashas result.
function getCurrentPeriods(dashaResult) {
  const maha = dashaResult.dashas.find(d => d.isCurrent);
  if (!maha) return null;
  const anta = maha.antardashas.find(a => a.isCurrent);
  const prat = anta ? anta.pratyantars.find(p => p.isCurrent) : null;
  return { maha, anta, prat };
}

// Remaining time in a period as a human-readable string.
function timeRemaining(endDate) {
  const ms  = endDate - new Date();
  if (ms <= 0) return 'ended';
  const days  = ms / 86400000;
  const years = Math.floor(days / 365);
  const mos   = Math.floor((days - years * 365) / 30);
  const d     = Math.floor(days - years * 365 - mos * 30);
  const parts = [];
  if (years) parts.push(years + ' yr' + (years > 1 ? 's' : ''));
  if (mos)   parts.push(mos + ' mo' + (mos > 1 ? 's' : ''));
  if (d && !years) parts.push(d + ' day' + (d > 1 ? 's' : ''));
  return parts.join(' ') || '<1 day';
}

// Planet glyph for display.
const PLANET_GLYPH = {
  Sun:'☀', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃',
  Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋'
};

// Planet colour class.
const PLANET_CLASS = {
  Sun:'pl-sun', Moon:'pl-moon', Mars:'pl-mars', Mercury:'pl-mercury',
  Jupiter:'pl-jupiter', Venus:'pl-venus', Saturn:'pl-saturn',
  Rahu:'pl-rahu', Ketu:'pl-ketu'
};

// ── Render HTML for the dasha section ──
function renderDashaHTML(dashaResult) {
  const current = getCurrentPeriods(dashaResult);
  if (!current) return '<p class="section-note">Dasha period could not be determined.</p>';

  const { maha, anta, prat } = current;
  const remainMaha = timeRemaining(maha.endDate);
  const remainAnta = anta ? timeRemaining(anta.endDate) : '—';
  const remainPrat = prat ? timeRemaining(prat.endDate) : '—';

  // Current period banner
  let html = `
    <div class="dasha-current-banner">
      <div class="dcb-row">
        <div class="dcb-cell">
          <div class="dcb-label">Mahadasha</div>
          <div class="dcb-planet ${PLANET_CLASS[maha.lord]}">${PLANET_GLYPH[maha.lord]} ${maha.lord}</div>
          <div class="dcb-dates">${fmtDate(maha.startDate)} – ${fmtDate(maha.endDate)}</div>
          <div class="dcb-remain">${remainMaha} remaining</div>
        </div>
        ${anta ? `
        <div class="dcb-sep">▸</div>
        <div class="dcb-cell">
          <div class="dcb-label">Antardasha</div>
          <div class="dcb-planet ${PLANET_CLASS[anta.lord]}">${PLANET_GLYPH[anta.lord]} ${anta.lord}</div>
          <div class="dcb-dates">${fmtDate(anta.startDate)} – ${fmtDate(anta.endDate)}</div>
          <div class="dcb-remain">${remainAnta} remaining</div>
        </div>` : ''}
        ${prat ? `
        <div class="dcb-sep">▸</div>
        <div class="dcb-cell">
          <div class="dcb-label">Pratyantar</div>
          <div class="dcb-planet ${PLANET_CLASS[prat.lord]}">${PLANET_GLYPH[prat.lord]} ${prat.lord}</div>
          <div class="dcb-dates">${fmtDate(prat.startDate)} – ${fmtDate(prat.endDate)}</div>
          <div class="dcb-remain">${remainPrat} remaining</div>
        </div>` : ''}
      </div>
    </div>

    <div class="dasha-reading">
      <p class="dasha-md-text">${MD_TEXT[maha.lord]}</p>
      ${anta ? `<p class="dasha-ad-text"><strong>${anta.lord} Antardasha:</strong> ${AD_MOD[anta.lord]}</p>` : ''}
    </div>
  `;

  // Antardasha timeline for the current Mahadasha
  if (maha.antardashas.length) {
    html += `
      <h4 class="dasha-sub-title">Antardashas within ${maha.lord} Mahadasha</h4>
      <div class="anta-timeline">
        ${maha.antardashas.map(a => antaRow(a, maha.lord)).join('')}
      </div>
    `;
  }

  // Pratyantar timeline for the current Antardasha
  if (anta && anta.pratyantars.length) {
    html += `
      <h4 class="dasha-sub-title">Pratyantar Dashas within ${maha.lord}–${anta.lord} Antardasha</h4>
      <div class="anta-timeline prat-timeline">
        ${anta.pratyantars.map(p => pratRow(p)).join('')}
      </div>
    `;
  }

  // Mahadasha timeline — past, present, future
  html += `
    <h4 class="dasha-sub-title">Mahadasha Timeline</h4>
    <div class="maha-timeline">
      ${dashaResult.dashas.map(d => mahaRow(d)).join('')}
    </div>
  `;

  return html;
}

function mahaRow(d) {
  const cls = d.isCurrent ? 'maha-row current' : (new Date() > d.endDate ? 'maha-row past' : 'maha-row future');
  return `
    <div class="${cls}">
      <div class="maha-planet ${PLANET_CLASS[d.lord]}">${PLANET_GLYPH[d.lord]} ${d.lord}</div>
      <div class="maha-years">${d.years} yrs</div>
      <div class="maha-dates">${fmtDate(d.startDate)} – ${fmtDate(d.endDate)}</div>
      ${d.isCurrent ? '<div class="maha-badge">Current</div>' : ''}
    </div>`;
}

function antaRow(a, mahaLord) {
  const today = new Date();
  const past = today > a.endDate;
  const cls = a.isCurrent ? 'anta-row current' : (past ? 'anta-row past' : 'anta-row future');
  return `
    <div class="${cls}">
      <div class="anta-planet ${PLANET_CLASS[a.lord]}">${PLANET_GLYPH[a.lord]} ${a.lord}</div>
      <div class="anta-dur">${fmtDuration(a.years)}</div>
      <div class="anta-dates">${fmtDate(a.startDate)} – ${fmtDate(a.endDate)}</div>
      ${a.isCurrent ? '<div class="anta-badge">Now</div>' : ''}
    </div>`;
}

function pratRow(p) {
  const today = new Date();
  const past = today > p.endDate;
  const cls = p.isCurrent ? 'anta-row prat current' : (past ? 'anta-row prat past' : 'anta-row prat future');
  return `
    <div class="${cls}">
      <div class="anta-planet ${PLANET_CLASS[p.lord]}">${PLANET_GLYPH[p.lord]} ${p.lord}</div>
      <div class="anta-dur">${fmtDuration(p.years)}</div>
      <div class="anta-dates">${fmtDate(p.startDate)} – ${fmtDate(p.endDate)}</div>
      ${p.isCurrent ? '<div class="anta-badge">Now</div>' : ''}
    </div>`;
}

if (typeof window !== 'undefined') {
  window.Dasha = { computeDashas, getCurrentPeriods, renderDashaHTML, fmtDate, fmtDuration, timeRemaining };
}
