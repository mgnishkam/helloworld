// ashtakavarga.js — Classical Ashtakavarga (8-source point system).
// Computes Bhinnashtakavarga for each of 7 planets + Lagna,
// then totals into Sarvashtakavarga. Used to assess transit strength
// and identify strong/weak signs in the natal chart.
// Depends on: SIGNS (interpret.js)

// ══════════════════════════════════════════════════════════
// § 1  BENEFIC POINT TABLES
// Each entry = array of 12 sign offsets (0-11) from the source's own sign
// that receive a benefic point (1) from that source.
// Classic rules from Brihat Parashara Hora Shastra.
// ══════════════════════════════════════════════════════════

// From SUN's position — houses that receive a point from Sun's sign
const FROM_SUN = {
  Sun:     [1,2,4,7,8,9,10,11],      // Sun gives points to itself +these offsets
  Moon:    [3,6,10,11],
  Mars:    [1,2,4,7,8,9,10,11],
  Mercury: [3,5,6,9,10,11,12],
  Jupiter: [5,6,9,11],
  Venus:   [6,7,12],
  Saturn:  [1,2,4,7,8,9,10,11],
  Lagna:   [3,4,6,10,11,12]
};

// From MOON's position
const FROM_MOON = {
  Sun:     [3,6,7,8,10,11],
  Moon:    [1,3,6,7,10,11],
  Mars:    [2,3,5,6,9,10,11],
  Mercury: [1,3,4,5,7,8,10,11],
  Jupiter: [1,4,7,8,10,11,12],
  Venus:   [3,4,5,7,9,10,11],
  Saturn:  [3,5,6,11],
  Lagna:   [3,6,10,11]
};

// From MARS's position
const FROM_MARS = {
  Sun:     [3,5,6,10,11],
  Moon:    [3,6,11],
  Mars:    [1,2,4,7,8,10,11],
  Mercury: [3,5,6,11],
  Jupiter: [6,10,11,12],
  Venus:   [6,8,11,12],
  Saturn:  [1,4,7,8,9,10,11],
  Lagna:   [1,3,6,10,11]
};

// From MERCURY's position
const FROM_MERCURY = {
  Sun:     [5,6,9,11,12],
  Moon:    [2,4,6,8,10,11],
  Mars:    [1,2,4,7,8,9,10,11],
  Mercury: [1,3,5,6,9,10,11,12],
  Jupiter: [6,8,11,12],
  Venus:   [1,2,3,4,5,8,9,11],
  Saturn:  [1,2,4,7,8,9,10,11],
  Lagna:   [1,2,4,6,8,10,11]
};

// From JUPITER's position
const FROM_JUPITER = {
  Sun:     [1,2,3,4,7,8,9,10,11],
  Moon:    [2,5,7,9,11],
  Mars:    [1,2,4,7,8,10,11],
  Mercury: [1,2,4,5,6,9,10,11],
  Jupiter: [1,2,3,4,7,8,10,11],
  Venus:   [2,5,6,9,10,11],
  Saturn:  [3,5,6,12],
  Lagna:   [1,2,4,5,6,7,9,10,11]
};

// From VENUS's position
const FROM_VENUS = {
  Sun:     [8,11,12],
  Moon:    [1,2,3,4,5,8,9,11,12],
  Mars:    [3,4,6,9,11,12],
  Mercury: [3,5,6,9,11],
  Jupiter: [5,8,9,10,11],
  Venus:   [1,2,3,4,5,8,9,10,11],
  Saturn:  [3,4,5,8,9,10,11],
  Lagna:   [1,2,3,4,5,8,9,11]
};

// From SATURN's position
const FROM_SATURN = {
  Sun:     [1,2,4,7,8,10,11],
  Moon:    [3,6,11],
  Mars:    [3,5,6,10,11,12],
  Mercury: [6,8,9,10,11,12],
  Jupiter: [5,6,11,12],
  Venus:   [6,11,12],
  Saturn:  [3,5,6,11],
  Lagna:   [1,3,4,6,10,11]
};

// From LAGNA (Ascendant position)
const FROM_LAGNA = {
  Sun:     [3,4,6,10,11,12],
  Moon:    [3,6,10,11],
  Mars:    [1,3,6,10,11],
  Mercury: [1,2,4,6,8,10,11],
  Jupiter: [1,2,4,5,6,7,9,10,11],
  Venus:   [1,2,3,4,5,8,9,11],
  Saturn:  [1,3,4,6,10,11],
  Lagna:   [] // Lagna doesn't contribute to its own BhinnaAV
};

const SOURCE_TABLES = { Sun:FROM_SUN, Moon:FROM_MOON, Mars:FROM_MARS, Mercury:FROM_MERCURY, Jupiter:FROM_JUPITER, Venus:FROM_VENUS, Saturn:FROM_SATURN };

// ══════════════════════════════════════════════════════════
// § 2  CORE COMPUTATION
// ══════════════════════════════════════════════════════════

// Compute Bhinnashtakavarga for one planet (7 planets + Lagna).
// Returns array of 12 values (point totals for signs 0..11).
function bhinnaAV(planetName, planetSignIdx, positions, lagnaSignIdx) {
  const table = SOURCE_TABLES[planetName];
  if (!table) return new Array(12).fill(0);

  const points = new Array(12).fill(0);
  const byPlanet = {};
  positions.forEach(p => { byPlanet[p.planet] = p.signIdx; });

  // 8 sources: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Lagna
  const SOURCES = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Lagna'];

  for (const src of SOURCES) {
    const beneficOffsets = table[src];
    if (!beneficOffsets || !beneficOffsets.length) continue;

    // Source sign: planet's sign for planets, Lagna sign for Lagna
    const srcSign = src === 'Lagna' ? lagnaSignIdx : (byPlanet[src] ?? -1);
    if (srcSign < 0) continue;

    // Each benefic offset from srcSign gets a point
    for (const off of beneficOffsets) {
      const targetSign = (srcSign + off - 1 + 12) % 12; // off is 1-based house
      points[targetSign]++;
    }
  }
  return points;
}

// Sarvashtakavarga: sum of all 7 planets' Bhinnashtakavarga
function sarvaAV(allBhinna) {
  const sarva = new Array(12).fill(0);
  for (const planet of ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn']) {
    if (!allBhinna[planet]) continue;
    for (let i = 0; i < 12; i++) sarva[i] += allBhinna[planet][i];
  }
  return sarva;
}

// ══════════════════════════════════════════════════════════
// § 3  TRANSIT STRENGTH + PREDICTIONS
// ══════════════════════════════════════════════════════════

// Transit quality thresholds
const PLANET_TRANSIT_THRESHOLD = { Sun:4, Moon:4, Mars:3, Mercury:4, Jupiter:4, Venus:5, Saturn:3 };
const SARVA_THRESHOLD = { weak:18, moderate:25, strong:30 };

function transitStrength(planetName, transitSignIdx, bhinnaPoints) {
  const pts = bhinnaPoints[planetName] ? bhinnaPoints[planetName][transitSignIdx] : 0;
  const threshold = PLANET_TRANSIT_THRESHOLD[planetName] || 4;
  const quality = pts >= threshold ? 'strong' : pts >= threshold - 2 ? 'moderate' : 'weak';
  return { pts, threshold, quality };
}

// Build a full analysis object
function buildAshtakavarga(positions, lagnaSignIdx, sidereal) {
  const byPlanet = {};
  positions.forEach(p => { byPlanet[p.planet] = p; });

  const planets7 = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  const allBhinna = {};
  for (const pl of planets7) {
    const signIdx = byPlanet[pl] ? byPlanet[pl].signIdx : 0;
    allBhinna[pl] = bhinnaAV(pl, signIdx, positions, lagnaSignIdx);
  }
  const sarva = sarvaAV(allBhinna);

  // Find strongest and weakest signs (Sarva)
  const sarvaMax = Math.max(...sarva);
  const sarvaMin = Math.min(...sarva);
  const strongest = sarva.map((v,i) => ({signIdx:i, pts:v})).sort((a,b) => b.pts-a.pts).slice(0,3);
  const weakest   = sarva.map((v,i) => ({signIdx:i, pts:v})).sort((a,b) => a.pts-b.pts).slice(0,3);

  // Transit strength for current transit planets (Jupiter, Saturn, Rahu are most watched)
  const today = new Date();
  const jd = julianDay(today.getFullYear(), today.getMonth()+1, today.getDate(), 12);
  const ay  = lahiriAyanamsa(jd);

  const transitData = {};
  for (const pl of planets7) {
    const tLon = ((planetLongitude(pl, jd) - ay) + 360) % 360;
    const tSign = Math.floor(tLon / 30);
    const strength = transitStrength(pl, tSign, allBhinna);
    transitData[pl] = { signIdx: tSign, sign: SIGNS[tSign], ...strength };
  }

  return { allBhinna, sarva, sarvaMax, sarvaMin, strongest, weakest, transitData };
}

// ══════════════════════════════════════════════════════════
// § 4  RENDER
// ══════════════════════════════════════════════════════════

const QUALITY_CLS   = { strong:'av-strong', moderate:'av-moderate', weak:'av-weak' };
const QUALITY_LABEL = { strong:'Strong ✦', moderate:'Moderate', weak:'Weak' };

function renderAshtakavargaHTML(av) {
  if (!av) return '';
  const planets7 = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  const GLYPH = { Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃', Venus:'♀', Saturn:'♄' };
  const PCLS  = { Sun:'pl-sun', Moon:'pl-moon', Mars:'pl-mars', Mercury:'pl-mercury', Jupiter:'pl-jupiter', Venus:'pl-venus', Saturn:'pl-saturn' };

  let html = '<div class="av-block">';

  // ── Current transit analysis (most practically useful) ──
  html += `
    <div class="av-transit-section">
      <div class="av-sub-title">Current Planetary Transit Strengths</div>
      <p class="av-note">Each planet's transit through a sign is strong (≥ threshold points) or weak in your natal Ashtakavarga. A planet transiting a strong sign produces better results; a weak sign delays or reduces results.</p>
      <div class="av-transit-grid">`;

  for (const pl of planets7) {
    const td = av.transitData[pl];
    const cls = QUALITY_CLS[td.quality];
    html += `
      <div class="av-transit-card ${cls}">
        <div class="av-tc-planet ${PCLS[pl]}">${GLYPH[pl]} ${pl}</div>
        <div class="av-tc-sign">${td.sign.name}</div>
        <div class="av-tc-pts">${td.pts} / 8 pts</div>
        <div class="av-tc-quality">${QUALITY_LABEL[td.quality]}</div>
        <div class="av-tc-bar"><div class="av-tc-fill" style="width:${Math.round(td.pts/8*100)}%"></div></div>
      </div>`;
  }
  html += `</div></div>`;

  // ── Sarvashtakavarga sign strengths ──
  html += `
    <div class="av-sarva-section">
      <div class="av-sub-title">Sarvashtakavarga — Sign Strength Map</div>
      <p class="av-note">Total benefic points per sign from all 7 planets combined (max 56). Signs with 28+ points are strong; signs with 25 or fewer are weak. Planets transiting strong signs in Sarva produce the best results.</p>
      <div class="av-sarva-grid">`;

  for (let i = 0; i < 12; i++) {
    const pts = av.sarva[i];
    const pct = Math.round(pts / 56 * 100);
    const quality = pts >= SARVA_THRESHOLD.strong ? 'strong' : pts >= SARVA_THRESHOLD.moderate ? 'moderate' : 'weak';
    const cls = QUALITY_CLS[quality];
    html += `
      <div class="av-sarva-cell ${cls}">
        <div class="av-sc-sign">${SIGNS[i].symbol} ${SIGNS[i].name}</div>
        <div class="av-sc-pts">${pts}</div>
        <div class="av-sc-bar"><div class="av-sc-fill" style="width:${pct}%"></div></div>
        <div class="av-sc-label">${QUALITY_LABEL[quality]}</div>
      </div>`;
  }
  html += `</div>`;

  // Strongest / weakest summary
  html += `
      <div class="av-extremes">
        <div class="av-ext-block av-strong">
          <div class="av-ext-title">Strongest Signs for Transits</div>
          ${av.strongest.map(s => `<div class="av-ext-row">${SIGNS[s.signIdx].symbol} ${SIGNS[s.signIdx].name} — <strong>${s.pts} pts</strong></div>`).join('')}
        </div>
        <div class="av-ext-block av-weak">
          <div class="av-ext-title">Weakest Signs — Transits Delayed</div>
          ${av.weakest.map(s => `<div class="av-ext-row">${SIGNS[s.signIdx].symbol} ${SIGNS[s.signIdx].name} — <strong>${s.pts} pts</strong></div>`).join('')}
        </div>
      </div>
    </div>`;

  // ── Bhinnashtakavarga table for key planets ──
  html += `
    <div class="av-bhinna-section">
      <div class="av-sub-title">Bhinnashtakavarga — Points per Sign</div>
      <p class="av-note">Individual planet scores across the 12 signs. When a planet transits a sign, check its own Bhinnashtakavarga: ≥4 pts = strong, ≤2 pts = weak. Jupiter and Saturn transits are most significant.</p>
      <div class="av-table-wrap">
        <table class="av-table">
          <thead>
            <tr>
              <th>Sign</th>`;
  for (const pl of ['Jupiter','Saturn','Mars','Sun','Moon','Mercury','Venus']) {
    html += `<th class="${PCLS[pl]}">${GLYPH[pl]}</th>`;
  }
  html += `<th>Sarva</th></tr></thead><tbody>`;

  for (let i = 0; i < 12; i++) {
    const sarvaQuality = av.sarva[i] >= SARVA_THRESHOLD.strong ? 'strong' : av.sarva[i] >= SARVA_THRESHOLD.moderate ? 'moderate' : 'weak';
    html += `<tr>
      <td><strong>${SIGNS[i].symbol} ${SIGNS[i].name}</strong></td>`;
    for (const pl of ['Jupiter','Saturn','Mars','Sun','Moon','Mercury','Venus']) {
      const pts = av.allBhinna[pl] ? av.allBhinna[pl][i] : 0;
      const threshold = PLANET_TRANSIT_THRESHOLD[pl];
      const cls = pts >= threshold ? 'av-pts-good' : pts <= threshold - 3 ? 'av-pts-bad' : '';
      html += `<td class="${cls}">${pts}</td>`;
    }
    html += `<td class="av-sarva-cell-inline ${QUALITY_CLS[sarvaQuality]}-text">${av.sarva[i]}</td>`;
    html += `</tr>`;
  }
  html += `</tbody></table></div></div>`;
  html += `</div>`;
  return html;
}

if (typeof window !== 'undefined') {
  window.Ashtakavarga = { buildAshtakavarga, renderAshtakavargaHTML };
}
