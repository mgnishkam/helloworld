// Dashamsha D10 — Career & Status divisional chart.
// Each sign divided into 10 parts of 3° each.
// Odd signs (0-indexed 0,2,4,6,8,10): parts map forward from the sign itself.
// Even signs (0-indexed 1,3,5,7,9,11): parts map forward from the 9th sign from it.

(function () {
  'use strict';

  // ── D10 sign from natal position ──
  function computeD10Sign(signIdx, degInSign) {
    const pada = Math.floor(degInSign / 3); // 0–9 (each part is 3°)
    const base = (signIdx % 2 === 0) ? signIdx : (signIdx + 8) % 12;
    return (base + pada) % 12;
  }

  // ── Dignity in D10 ──
  const EXALT = { Sun:0, Moon:1, Mars:9, Mercury:5, Jupiter:3, Venus:11, Saturn:6, Rahu:1, Ketu:7 };
  const DEBIL = { Sun:6, Moon:7, Mars:3, Mercury:11, Jupiter:9, Venus:5, Saturn:0, Rahu:7, Ketu:1 };
  const OWN   = {
    Sun:[4], Moon:[3], Mars:[0,7], Mercury:[2,5],
    Jupiter:[8,11], Venus:[1,6], Saturn:[9,10], Rahu:[], Ketu:[]
  };

  function d10Dignity(planet, d10Sign) {
    if (EXALT[planet] === d10Sign) return 'exalted';
    if ((OWN[planet] || []).includes(d10Sign)) return 'own sign';
    if (DEBIL[planet] === d10Sign) return 'debilitated';
    return '';
  }

  // ── Career themes by planet ──
  const CAREER_THEME = {
    Sun:     'Government, leadership, management, medicine, politics, authority',
    Moon:    'Public service, hospitality, psychology, import/export, food industry',
    Mars:    'Engineering, military, surgery, sports, construction, law enforcement',
    Mercury: 'Business, IT, communication, writing, accounting, trade, media',
    Jupiter: 'Teaching, law, finance, advisory, spirituality, publishing, consulting',
    Venus:   'Arts, fashion, beauty, entertainment, luxury goods, diplomacy',
    Saturn:  'Manufacturing, real estate, agriculture, mining, discipline-based fields',
    Rahu:    'Technology, media, foreign work, innovation, unconventional fields',
    Ketu:    'Spirituality, research, technical expertise, healing, ancestral skills'
  };

  // ── D10 house themes (1–12) ──
  const HOUSE_THEME = [
    'Career identity, self-employment, leadership',
    'Income, speech, family enterprise',
    'Communication, self-effort, media',
    'Security, fixed assets, education',
    'Creativity, intellect, speculation',
    'Service, health, competitive fields',
    'Business partnerships, trade, consultancy',
    'Research, transformation, hidden work',
    'Law, higher education, travel, dharma',
    'Peak career, public life, government',
    'Gains, networks, large organisations',
    'Foreign career, spiritual service, seclusion'
  ];

  // ── Career strength by D10 house (out of 10) ──
  const HOUSE_STRENGTH = [8,5,6,4,7,3,5,2,7,10,8,2];

  function houseFromSign(planetSign, lagnaSign) {
    return ((planetSign - lagnaSign + 12) % 12) + 1;
  }

  // Atmakaraka: planet with highest degree in its natal sign (Jaimini; excludes Rahu/Ketu)
  function computeAtmakaraka(positions) {
    const el = positions.filter(p => !['Rahu','Ketu'].includes(p.planet));
    return el.reduce((mx, p) => p.degInSign > mx.degInSign ? p : mx, el[0]);
  }

  // ── Build D10 data ──
  function buildDashamsha(positions, lagnaDecoded) {
    const d10LagnaSign = computeD10Sign(lagnaDecoded.signIdx, lagnaDecoded.degInSign);

    const d10Planets = positions.map(p => {
      const d10Sign    = computeD10Sign(p.signIdx, p.degInSign);
      const d10House   = houseFromSign(d10Sign, d10LagnaSign);
      const dignity    = d10Dignity(p.planet, d10Sign);
      const hStr       = HOUSE_STRENGTH[d10House - 1];
      const digBonus   = dignity === 'exalted' ? 3 : dignity === 'own sign' ? 2 : dignity === 'debilitated' ? -3 : 0;
      return { ...p, d10Sign, d10House, d10Dignity: dignity, careerScore: hStr + digBonus };
    });

    const d10TenthSign = (d10LagnaSign + 9) % 12;
    const d10TenthLord = SIGNS[d10TenthSign].lord;

    const atmakaraka = computeAtmakaraka(positions);
    const akD10      = d10Planets.find(p => p.planet === atmakaraka.planet);

    const topCareer = [...d10Planets]
      .filter(p => p.planet !== 'Ketu')
      .sort((a, b) => b.careerScore - a.careerScore)
      .slice(0, 3);

    return { d10LagnaSign, d10TenthSign, d10TenthLord, d10Planets, atmakaraka: akD10, topCareer };
  }

  // ── Render ──
  function renderDashamshaHTML(d10) {
    const CELL = [null,
      '1/2/2/3','1/3/2/4','1/4/2/5','2/4/3/5',
      '3/4/4/5','4/4/5/5','4/3/5/4','4/2/5/3',
      '4/1/5/2','3/1/4/2','2/1/3/2','1/1/2/2'
    ];
    const ABBR = { Sun:'Su',Moon:'Mo',Mars:'Ma',Mercury:'Me',Jupiter:'Ju',Venus:'Ve',Saturn:'Sa',Rahu:'Ra',Ketu:'Ke' };
    const PCLS = {
      Sun:'pl-sun', Moon:'pl-moon', Mars:'pl-mars', Mercury:'pl-mercury',
      Jupiter:'pl-jupiter', Venus:'pl-venus', Saturn:'pl-saturn', Rahu:'pl-rahu', Ketu:'pl-ketu'
    };
    const DIG_GLYPH = { exalted:'★', 'own sign':'◆', debilitated:'▼' };

    // House map
    const houseMap = {};
    for (let i = 1; i <= 12; i++) houseMap[i] = [];
    d10.d10Planets.forEach(p => houseMap[p.d10House].push(p));

    // Chart
    let chart = '<div class="rashi-chart-wrap"><div class="rashi-chart">';
    for (let h = 1; h <= 12; h++) {
      const si  = (d10.d10LagnaSign + h - 1) % 12;
      const sg  = SIGNS[si];
      const pls = houseMap[h];
      chart += `<div class="rc-house${h===1?' rc-lagna':''}" style="grid-area:${CELL[h]}">`;
      chart += `<div class="rc-hnum">${h}</div>`;
      if (h === 1) chart += `<div class="rc-asc">Asc</div>`;
      chart += `<div class="rc-symbol">${sg.symbol}</div>`;
      chart += `<div class="rc-sign-name">${sg.name}</div>`;
      if (pls.length) {
        chart += '<div class="rc-planets">';
        pls.forEach(p => {
          const g = DIG_GLYPH[p.d10Dignity] || '';
          chart += `<span class="rc-pl ${PCLS[p.planet]}">${ABBR[p.planet]}${g}</span>`;
        });
        chart += '</div>';
      }
      chart += '</div>';
    }
    chart += `
      <div class="rc-center">
        <div class="rc-center-title">D10<br/>Dashamsha</div>
        <div class="rc-center-sub">Career Chart</div>
      </div>`;
    chart += '</div></div>';

    // Planet table
    const table = `
      <div class="table-wrap" style="margin-top:20px">
        <table class="planet-table">
          <thead>
            <tr>
              <th>Graha</th><th>D10 Sign</th><th>D10 House</th><th>Dignity</th><th>Career Fields</th>
            </tr>
          </thead>
          <tbody>
            ${d10.d10Planets.map(p => {
              const dc = p.d10Dignity === 'exalted' || p.d10Dignity === 'own sign' ? 'good'
                       : p.d10Dignity === 'debilitated' ? 'bad' : '';
              return `<tr>
                <td><strong>${p.planet}</strong></td>
                <td>${SIGNS[p.d10Sign].symbol} ${SIGNS[p.d10Sign].english}</td>
                <td>H${p.d10House} &mdash; <em style="color:rgba(60,60,60,0.7)">${HOUSE_THEME[p.d10House-1]}</em></td>
                <td class="${dc}">${p.d10Dignity || 'neutral'}</td>
                <td style="font-size:0.83rem;color:rgba(60,60,60,0.8)">${CAREER_THEME[p.planet]}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

    // Top career planets
    const top = `
      <div class="d10-top-wrap">
        <h4 class="d10-top-title">Strongest Career Planets in D10</h4>
        <div class="d10-top-grid">
          ${d10.topCareer.map((p, i) => `
            <div class="d10-top-card">
              <div class="d10-rank">${['①','②','③'][i]}</div>
              <div class="d10-planet-name ${PCLS[p.planet]}">${p.planet}</div>
              <div class="d10-house-badge">H${p.d10House} &middot; ${SIGNS[p.d10Sign].english}</div>
              ${p.d10Dignity ? `<div class="d10-dignity ${p.d10Dignity==='exalted'?'good':p.d10Dignity==='debilitated'?'bad':''}">${p.d10Dignity}</div>` : ''}
              <p class="d10-career-kw">${CAREER_THEME[p.planet]}</p>
            </div>`).join('')}
        </div>
      </div>`;

    // Key indicators
    const ak   = d10.atmakaraka;
    const info = `
      <div class="d10-info-grid">
        <div class="d10-info-card">
          <div class="d10-info-label">D10 Lagna</div>
          <div class="d10-info-sign">${SIGNS[d10.d10LagnaSign].symbol} ${SIGNS[d10.d10LagnaSign].english}</div>
          <p class="d10-info-text">Your professional personality and the type of career environment where you naturally thrive. The Lagna lord's placement in D10 shows the main career driver.</p>
        </div>
        <div class="d10-info-card">
          <div class="d10-info-label">D10 10th House Lord</div>
          <div class="d10-info-sign">${d10.d10TenthLord} rules ${SIGNS[d10.d10TenthSign].symbol} ${SIGNS[d10.d10TenthSign].english}</div>
          <p class="d10-info-text">The D10 10th lord is the primary career significator — its strength, dignity and current Dasha period are the most reliable timing indicators for career peaks and transitions.</p>
        </div>
        ${ak ? `
        <div class="d10-info-card">
          <div class="d10-info-label">Ātmakāraka (Jaimini)</div>
          <div class="d10-info-sign ${PCLS[ak.planet]}">${ak.planet} — D10 H${ak.d10House}</div>
          <p class="d10-info-text">The soul-significator (planet with the highest degree in its natal sign). In D10 it reveals the deeper karmic calling behind your professional life and where your soul seeks fulfilment through work.</p>
        </div>` : ''}
      </div>`;

    return chart + table + top + info;
  }

  window.Dashamsha = { computeD10Sign, buildDashamsha, renderDashamshaHTML };
})();
