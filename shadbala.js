// Shadbala — Six-fold Vedic planetary strength assessment.
// Computes a simplified but accurate Shadbala covering the six classical
// components: Sthanabala, Digbala, Kalabala, Chestabala, Naisargikabala,
// and Drikbala. Scores are expressed as Virupas (1 Rupa = 60 Virupas).

(function () {
  'use strict';

  // ── Exaltation points (sign index, exact degree) ──
  const EXALT_POINT = {
    Sun:     { sign: 0, deg: 10 },  // Aries 10°
    Moon:    { sign: 1, deg:  3 },  // Taurus 3°
    Mars:    { sign: 9, deg: 28 },  // Capricorn 28°
    Mercury: { sign: 5, deg: 15 },  // Virgo 15°
    Jupiter: { sign: 3, deg:  5 },  // Cancer 5°
    Venus:   { sign:11, deg: 27 },  // Pisces 27°
    Saturn:  { sign: 6, deg: 20 },  // Libra 20°
    Rahu:    { sign: 1, deg:  3 },  // Taurus 3° (Vaidika)
    Ketu:    { sign: 7, deg:  3 },  // Scorpio 3°
  };

  // ── Digbala max-strength houses (1-indexed) ──
  const DIGBALA_HOUSE = {
    Sun: 10, Mars: 10,
    Moon: 4, Venus: 4,
    Mercury: 1, Jupiter: 1,
    Saturn: 7,
    Rahu: 3, Ketu: 9
  };

  // ── Naisargikabala (Natural strength) — fixed Virupas ──
  const NAISARGIKA = {
    Sun: 60.0, Moon: 51.43, Venus: 42.86, Jupiter: 34.29,
    Mercury: 25.71, Mars: 17.14, Saturn: 8.57,
    Rahu: 12.0, Ketu: 8.0
  };

  // ── Dignity → Saptavargaja Bala approximation ──
  const DIGNITY_BALA = {
    'exalted': 45, 'moolatrikona': 37.5, 'own sign': 30,
    'friendly': 15, 'neutral': 7.5, 'inimical': 3.75, 'debilitated': 0
  };

  // ── Weekday planet lords (0=Sun/Sunday … 6=Saturn/Saturday) ──
  const VARA_LORDS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];

  // ── Life area ruled by each planet (for interpretation) ──
  const LIFE_AREA = {
    Sun:     'authority, father, soul, health, vitality',
    Moon:    'mind, emotions, mother, public life, prosperity',
    Mars:    'courage, energy, siblings, property, action',
    Mercury: 'intellect, communication, business, education',
    Jupiter: 'wisdom, wealth, children, spirituality, luck',
    Venus:   'relationships, marriage, arts, luxury, pleasure',
    Saturn:  'discipline, longevity, service, karma, delays',
    Rahu:    'worldly ambition, foreign, technology, desire',
    Ketu:    'spirituality, liberation, past karma, research'
  };

  // Minimum required Virupas (scaled to our simplified total max ~250)
  const MIN_REQUIRED = {
    Sun: 165, Moon: 155, Mars: 125, Mercury: 180,
    Jupiter: 170, Venus: 140, Saturn: 130, Rahu: 100, Ketu: 90
  };

  // ── Helper: angular longitude in degrees ──
  function signLon(signIdx, degInSign) { return signIdx * 30 + degInSign; }

  // Angular distance between two ecliptic longitudes (0–180)
  function angDist(lon1, lon2) {
    let d = Math.abs(lon1 - lon2) % 360;
    if (d > 180) d = 360 - d;
    return d;
  }

  // ── 1. Uchcha Bala (part of Sthanabala) — 0–60 Virupas ──
  function ucchaBala(planet, signIdx, degInSign) {
    const ep = EXALT_POINT[planet];
    if (!ep) return 30;
    const pLon = signLon(signIdx, degInSign);
    const eLon = signLon(ep.sign, ep.deg);
    const dist = angDist(pLon, eLon);
    return 60 * (1 - dist / 180);
  }

  // ── 2. Saptavargaja Bala (simplified — dignity in D1) — 0–45 Virupas ──
  function saptavargajaBala(dignity) {
    return DIGNITY_BALA[dignity] ?? 7.5;
  }

  // ── 3. Kendradi Bala (by house type) — 15/30/60 Virupas ──
  function kendradiBala(house) {
    if ([1,4,7,10].includes(house)) return 60;
    if ([2,5,8,11].includes(house)) return 30;
    return 15;
  }

  // ── 4. Digbala — 0–60 Virupas ──
  function digbala(planet, house) {
    const maxH = DIGBALA_HOUSE[planet] ?? 10;
    let d = Math.abs(house - maxH);
    if (d > 6) d = 12 - d;
    return 60 * (6 - d) / 6;
  }

  // ── 5. Paksha Bala (Moon phase) — 0–60 Virupas ──
  // Stronger at Full Moon, weaker at New Moon.
  function pakshabala(moonLon, sunLon) {
    const angle = ((moonLon - sunLon + 360) % 360);
    return 60 * (angle <= 180 ? angle / 180 : (360 - angle) / 180);
  }

  // ── 6. Vara Bala (weekday lord) — 45 Virupas for the day's ruler ──
  function varaBala(planet, dayOfWeek) {
    return VARA_LORDS[dayOfWeek] === planet ? 45 : 0;
  }

  // ── 7. Chestabala (Motional strength) — 0–60 Virupas ──
  function chestabala(planet, retrograde, combust, pakshaVal) {
    if (planet === 'Moon') return pakshaVal;  // Moon uses Paksha
    if (planet === 'Sun')  return 30;         // Sun always moderate
    if (combust)           return 0;          // Combust = weakest
    if (retrograde)        return 60;         // Retrograde = most powerful
    return 30;                                // Direct
  }

  // ── 8. Drikbala (Aspectual strength) — -30 to +30 Virupas ──
  // Benefic aspects received add, malefic aspects subtract.
  function drikbala(planetName, planetHouse, allPositions) {
    const BENEFICS  = new Set(['Moon','Mercury','Jupiter','Venus']);
    const MALEFICS  = new Set(['Sun','Mars','Saturn','Rahu','Ketu']);
    const FULL_ASP  = 7; // all planets cast 7th aspect (180°)
    const SPECIAL   = { Mars:[4,8], Jupiter:[5,9], Saturn:[3,10] };

    let score = 0;
    allPositions.forEach(asp => {
      if (asp.planet === planetName) return;
      const hDiff = ((planetHouse - asp.house + 12) % 12) + 1;
      let aspects = false;
      if (hDiff === FULL_ASP) aspects = true;
      if ((SPECIAL[asp.planet] || []).includes(hDiff)) aspects = true;
      if (!aspects) return;
      score += BENEFICS.has(asp.planet) ? 15 : -10;
    });
    return Math.max(-30, Math.min(30, score));
  }

  // Day of week from Julian Day
  function dayOfWeek(jd) {
    return Math.floor(jd + 1.5) % 7; // 0=Sunday
  }

  // ── Build Shadbala ──
  function buildShadbala(positions, chart) {
    const jd       = chart.jd;
    const dow      = dayOfWeek(jd);
    const moonLon  = chart.sidereal.Moon;
    const sunLon   = chart.sidereal.Sun;
    const paksha   = pakshabala(moonLon, sunLon);

    const results = positions.map(p => {
      const ub   = ucchaBala(p.planet, p.signIdx, p.degInSign);
      const svb  = saptavargajaBala(p.dignity);
      const kb   = kendradiBala(p.house);
      const db   = digbala(p.planet, p.house);
      const vb   = varaBala(p.planet, dow);
      const cb   = chestabala(p.planet, p.retrograde, p.combust, paksha);
      const nb   = NAISARGIKA[p.planet] ?? 20;
      const drb  = drikbala(p.planet, p.house, positions);

      // Sthanabala = Uchcha + Saptavargaja + Kendradi
      const sthanabala    = ub + svb + kb;
      // Kalabala = Vara + Paksha contribution
      const kalabala      = vb + (p.planet === 'Moon' ? 0 : paksha * 0.3);
      const chestabalaVal = cb;
      const naisargika    = nb;
      const drikbalaVal   = drb;
      const total         = sthanabala + db + kalabala + chestabalaVal + naisargika + drikbalaVal;

      const minReq = MIN_REQUIRED[p.planet] ?? 130;
      const pct    = Math.round(total / 3.45); // express as 0-100 (max~345)
      const grade  = pct >= 70 ? 'A' : pct >= 55 ? 'B' : pct >= 40 ? 'C' : pct >= 25 ? 'D' : 'F';
      const strong = total >= minReq;

      return {
        planet:      p.planet,
        house:       p.house,
        dignity:     p.dignity,
        retrograde:  p.retrograde,
        combust:     p.combust,
        sthanabala:  Math.round(sthanabala),
        digbala:     Math.round(db),
        kalabala:    Math.round(kalabala),
        chestabala:  Math.round(chestabalaVal),
        naisargika:  Math.round(nb),
        drikbala:    Math.round(drikbalaVal),
        total:       Math.round(total),
        pct, grade, strong, minReq
      };
    });

    const sorted    = [...results].sort((a, b) => b.total - a.total);
    const strongest = sorted.slice(0, 3);
    const weakest   = sorted.slice(-2).reverse();

    return { planets: results, strongest, weakest };
  }

  // ── Render ──
  function renderShadabalaHTML(shad) {
    const PCLS = {
      Sun:'pl-sun', Moon:'pl-moon', Mars:'pl-mars', Mercury:'pl-mercury',
      Jupiter:'pl-jupiter', Venus:'pl-venus', Saturn:'pl-saturn',
      Rahu:'pl-rahu', Ketu:'pl-ketu'
    };
    const GRADE_COLOR = { A:'#7fdb96', B:'#b8e070', C:'#f0d080', D:'#ffaa55', F:'#ff7b7b' };

    function bar(val, max, cls) {
      const pct = Math.min(100, Math.round(val / max * 100));
      return `<div class="sb-comp-bar-bg"><div class="sb-comp-bar ${cls}" style="width:${pct}%"></div></div>`;
    }

    // Summary cards
    const summaryHtml = `
      <div class="sb-summary">
        <div class="sb-summary-block">
          <div class="sb-summary-label">Strongest Planets</div>
          ${shad.strongest.map(p => `
            <div class="sb-summary-item">
              <span class="${PCLS[p.planet]} sb-sum-planet">${p.planet}</span>
              <span class="sb-sum-grade" style="color:${GRADE_COLOR[p.grade]}">${p.grade} (${p.pct}%)</span>
              <span class="sb-sum-area">${LIFE_AREA[p.planet]}</span>
            </div>`).join('')}
        </div>
        <div class="sb-summary-block">
          <div class="sb-summary-label">Planets Needing Attention</div>
          ${shad.weakest.map(p => `
            <div class="sb-summary-item">
              <span class="${PCLS[p.planet]} sb-sum-planet">${p.planet}</span>
              <span class="sb-sum-grade" style="color:${GRADE_COLOR[p.grade]}">${p.grade} (${p.pct}%)</span>
              <span class="sb-sum-area">${LIFE_AREA[p.planet]}</span>
            </div>`).join('')}
        </div>
      </div>`;

    // Planet cards
    const MAX_COMP = { sthanabala:165, digbala:60, kalabala:60, chestabala:60, naisargika:60, drikbala:30 };

    const cardsHtml = `
      <div class="sb-grid">
        ${shad.planets.map(p => {
          const gc = GRADE_COLOR[p.grade];
          const totalPct = p.pct;
          const comps = [
            { label:'Sthāna', key:'sthanabala', tip:'Positional — exaltation, sign dignity, house type' },
            { label:'Dig',    key:'digbala',    tip:'Directional — strength from preferred direction' },
            { label:'Kāla',   key:'kalabala',   tip:'Temporal — weekday lord, lunar phase share' },
            { label:'Chestā', key:'chestabala', tip:'Motional — retrograde, direct, combust status' },
            { label:'Naisargika', key:'naisargika', tip:'Natural strength — fixed planetary hierarchy' },
            { label:'Drik',   key:'drikbala',   tip:'Aspectual — benefic aspects received (positive) or malefic (negative)' },
          ];
          const flags = [];
          if (p.retrograde) flags.push('<span class="sb-flag sb-retro">℞ Retrograde</span>');
          if (p.combust)    flags.push('<span class="sb-flag sb-combust">☀ Combust</span>');
          if (p.dignity === 'exalted') flags.push('<span class="sb-flag sb-exalt">★ Exalted</span>');
          if (p.dignity === 'debilitated') flags.push('<span class="sb-flag sb-debil">▼ Debilitated</span>');
          return `
            <div class="sb-card">
              <div class="sb-card-head">
                <div class="sb-card-planet ${PCLS[p.planet]}">${p.planet}</div>
                <div class="sb-card-grade" style="color:${gc}">${p.grade}</div>
                <div class="sb-card-score">${p.total} <span class="sb-viru">Virupas</span></div>
              </div>
              <div class="sb-total-bar-bg">
                <div class="sb-total-bar" style="width:${totalPct}%;background:${gc}"></div>
              </div>
              <div class="sb-card-status">
                <span style="color:${p.strong ? 'var(--good)' : 'var(--bad)'};font-size:0.78rem">
                  ${p.strong ? '✓ Meets minimum' : '✗ Below minimum'} (${p.minReq} req.)
                </span>
                ${flags.join('')}
              </div>
              <div class="sb-comps">
                ${comps.map(c => `
                  <div class="sb-comp-row" title="${c.tip}">
                    <div class="sb-comp-label">${c.label}</div>
                    ${bar(p[c.key], MAX_COMP[c.key], PCLS[p.planet])}
                    <div class="sb-comp-val">${p[c.key]}</div>
                  </div>`).join('')}
              </div>
              <p class="sb-card-interp">
                ${shadInterp(p)}
              </p>
            </div>`;
        }).join('')}
      </div>`;

    return summaryHtml + cardsHtml;
  }

  function shadInterp(p) {
    const { planet, grade, pct, retrograde, combust, dignity, house } = p;
    const area = LIFE_AREA[planet];
    let txt = '';
    if (grade === 'A' || grade === 'B') {
      txt = `${planet} is strong (${pct}%) — it powerfully delivers its significations: ${area}. Its Dasha periods tend to be productive and rewarding.`;
    } else if (grade === 'C') {
      txt = `${planet} is moderate (${pct}%) — it gives mixed results for ${area}. Results improve significantly during its Dasha when it is well-transited.`;
    } else {
      txt = `${planet} is weak (${pct}%) — it struggles to deliver its significations: ${area}. Strengthening this planet through targeted upayas (remedies) is especially beneficial.`;
    }
    if (retrograde) txt += ' Retrograde status intensifies its motional strength but can make its results internalised or delayed.';
    if (combust)    txt += ' Combustion by the Sun suppresses its outward expression.';
    if (dignity === 'exalted') txt += ` Exaltation gives it peak positional power.`;
    if (dignity === 'debilitated') txt += ` Debilitation weakens its positional contribution significantly.`;
    return txt;
  }

  window.Shadbala = { buildShadbala, renderShadabalaHTML };
})();
