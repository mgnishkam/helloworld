// Kundali Milan — Vedic marriage compatibility using the Ashta Koot (8-factor) system.
// Uses global SIGNS and NAKSHATRAS from interpret.js.

(function () {
  'use strict';

  const NAK_SPAN = 360 / 27;

  // ── Gana: 0=Deva, 1=Manushya, 2=Rakshasa (by nakshatra 0-26) ──
  const GANA = [0,1,2,1,0,1,0,0,2,2,1,1,0,2,0,2,0,2,2,1,1,0,2,2,1,1,0];
  const GANA_NAMES = ['Deva','Manushya','Rakshasa'];

  // ── Nadi: 0=Ādi(Vāta), 1=Madhya(Pitta), 2=Antya(Kapha) (by nakshatra 0-26) ──
  const NADI = [0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2];
  const NADI_NAMES = ['Ādi (Vāta)','Madhya (Pitta)','Antya (Kapha)'];

  // ── Yoni (animal) by nakshatra 0-26 ──
  // 0=Horse, 1=Elephant, 2=Sheep, 3=Serpent, 4=Dog, 5=Cat,
  // 6=Rat,   7=Cow,      8=Buffalo,9=Tiger, 10=Deer, 11=Monkey, 12=Mongoose, 13=Lion
  const YONI = [0,1,2,3,3,4,5,2,5,6,6,7,8,9,8,9,10,10,4,11,12,11,13,0,13,7,1];
  const YONI_NAMES = [
    'Ashwa (Horse)','Gaja (Elephant)','Mesha (Sheep)','Sarpa (Serpent)',
    'Shwan (Dog)','Marjara (Cat)','Mushaka (Rat)','Go (Cow)',
    'Mahisha (Buffalo)','Vyaghra (Tiger)','Mriga (Deer)','Vanara (Monkey)',
    'Nakula (Mongoose)','Simha (Lion)'
  ];
  // Natural enemy pairs — bidirectional (score = 0)
  const YONI_ENEMIES = [[0,8],[1,13],[2,11],[3,12],[4,10],[5,6],[7,9]];

  // ── Varna by Moon sign: 0=Brahmin, 1=Kshatriya, 2=Vaishya, 3=Shudra ──
  // Aries=1, Taurus=2, Gemini=3, Cancer=0, Leo=1, Virgo=2, Libra=3, Scorpio=0,
  // Sagittarius=1, Capricorn=2, Aquarius=3, Pisces=0
  const VARNA_BY_SIGN = [1,2,3,0,1,2,3,0,1,2,3,0];
  const VARNA_NAMES = ['Brahmin','Kshatriya','Vaishya','Shudra'];

  // ── Vasya (attraction group) by Moon sign ──
  // 0=Human, 1=Quadruped, 2=Water, 3=Wild, 4=Insect
  const VASYA_BY_SIGN = [1,1,0,2,3,0,0,4,0,1,0,2];
  const VASYA_NAMES = ['Human','Quadruped','Water','Wild','Insect'];
  // Compatibility score matrix [groupA][groupB]
  const VASYA_SCORE = [
    [2,1,1,0,0], // Human
    [1,2,0,1,0], // Quadruped
    [1,0,2,0,0], // Water
    [0,1,0,2,0], // Wild
    [0,0,0,0,2]  // Insect
  ];

  // ── Rashi lords: 0=Sun,1=Moon,2=Mars,3=Mercury,4=Jupiter,5=Venus,6=Saturn ──
  const RASHI_LORD = [2,5,3,1,0,3,5,2,4,6,6,4];
  const LORD_NAMES = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  // Planet friendship [from][to]: 'F'=Friend, 'N'=Neutral, 'E'=Enemy
  const PL_FRIEND = [
    ['F','F','F','N','F','E','E'], // Sun
    ['F','F','N','F','N','N','N'], // Moon
    ['F','F','F','E','F','N','N'], // Mars
    ['F','E','N','F','N','F','N'], // Mercury
    ['F','F','F','E','F','E','N'], // Jupiter
    ['E','E','N','F','N','F','F'], // Venus
    ['E','E','E','N','N','F','F']  // Saturn
  ];

  // ── Gana score matrix [groom_gana][bride_gana] ──
  const GANA_MATRIX = [[6,5,1],[6,6,0],[1,0,6]];

  // ── Utility: sidereal moon longitude → nakshatra index (0-26) ──
  function computeNakshatra(moonSignIdx, degInSign) {
    const lon = moonSignIdx * 30 + degInSign;
    return Math.floor(lon / NAK_SPAN) % 27;
  }

  // Tara: count from nakA to nakB (mod 27), mod 9 → position 1-9
  // Auspicious positions: 2 Sampat, 4 Kshema, 6 Sadhaka, 8 Mitra, 9 Param Mitra
  function taraAusp(fromNak, toNak) {
    const diff = ((toNak - fromNak) % 27 + 27) % 27;
    const pos  = (diff % 9) + 1;
    return [2,4,6,8,9].includes(pos);
  }

  // ── Core computation ──
  function computeKoot(groomNak, groomRashi, brideNak, brideRashi) {

    // 1. VARNA (1 pt) — hierarchy: Brahmin(0) > Kshatriya(1) > Vaishya(2) > Shudra(3)
    const gV = VARNA_BY_SIGN[groomRashi], bV = VARNA_BY_SIGN[brideRashi];
    const varnaScore = (gV <= bV) ? 1 : 0;

    // 2. VASYA (2 pt)
    const gVas = VASYA_BY_SIGN[groomRashi], bVas = VASYA_BY_SIGN[brideRashi];
    const vasyaScore = VASYA_SCORE[gVas][bVas];

    // 3. TARA (3 pt) — count from each person's nak to the other's
    const groomAusp = taraAusp(brideNak, groomNak);
    const brideAusp = taraAusp(groomNak, brideNak);
    const taraScore = (groomAusp ? 1.5 : 0) + (brideAusp ? 1.5 : 0);

    // 4. YONI (4 pt) — animal compatibility
    const gY = YONI[groomNak], bY = YONI[brideNak];
    const yoniScore = (gY === bY) ? 4
      : YONI_ENEMIES.some(([a,b]) => (a===gY&&b===bY)||(a===bY&&b===gY)) ? 0
      : 2;

    // 5. GRAHA MAITRI (5 pt) — Moon-sign lord friendship
    const gL = RASHI_LORD[groomRashi], bL = RASHI_LORD[brideRashi];
    let grahaMaitri;
    if (gL === bL) {
      grahaMaitri = 5;
    } else {
      const g2b = PL_FRIEND[gL][bL], b2g = PL_FRIEND[bL][gL];
      if      (g2b==='F' && b2g==='F')                               grahaMaitri = 5;
      else if ((g2b==='F'&&b2g==='N') || (g2b==='N'&&b2g==='F'))    grahaMaitri = 4;
      else if (g2b==='N' && b2g==='N')                               grahaMaitri = 3;
      else if ((g2b==='F'&&b2g==='E') || (g2b==='E'&&b2g==='F'))    grahaMaitri = 1;
      else                                                             grahaMaitri = 0;
    }

    // 6. GANA (6 pt) — temperament
    const gG = GANA[groomNak], bG = GANA[brideNak];
    const ganaScore = GANA_MATRIX[gG][bG];

    // 7. BHAKUT (7 pt) — Moon-sign distance
    // Inauspicious relationships: 2/12, 5/9, 6/8 (financial stress, health, conflict)
    const d1 = ((brideRashi - groomRashi + 12) % 12) + 1;
    const d2 = ((groomRashi - brideRashi + 12) % 12) + 1;
    const BHAKUT_BAD = [[2,12],[5,9],[6,8]];
    const bhakutBad  = BHAKUT_BAD.some(([a,b]) =>
      (d1===a&&d2===b) || (d1===b&&d2===a)
    );
    const bhakutScore = bhakutBad ? 0 : 7;

    // 8. NADI (8 pt) — energy constitution (same Nadi = major dosha)
    const gN = NADI[groomNak], bN = NADI[brideNak];
    const nadiScore = gN === bN ? 0 : 8;

    const total = varnaScore + vasyaScore + taraScore + yoniScore +
                  grahaMaitri + ganaScore + bhakutScore + nadiScore;

    // ── Identify doshas ──
    const doshas = [];
    if (nadiScore === 0) {
      doshas.push({
        name: 'Nadi Dosha',
        severity: 'major',
        desc: `Both charts share the ${NADI_NAMES[gN]} Nadi — the most serious compatibility concern in Ashta Koot. Nadi Dosha is associated with health challenges, difficulties with progeny, and a tendency for the relationship to feel energetically draining over time. Traditional remedies: Maha Nadi Dosha Nivarana Puja performed by a Shastri before the wedding. Many classical texts also list exceptions (Nadi exceptions) — consult a Jyotishi if this pair is otherwise strong.`
      });
    }
    if (bhakutScore === 0) {
      doshas.push({
        name: 'Bhakut Dosha',
        severity: 'significant',
        desc: `The ${d1}/${d2} Moon-sign relationship (${SIGNS[groomRashi].english} / ${SIGNS[brideRashi].english}) is considered inauspicious for Bhakut. This can create friction in emotional bonding, shared finances, or health across the years of marriage. A strong Nadi score, Graha Maitri, and good Gana can offset much of this. Remedy: Shiva-Parvati Puja together on Mondays.`
      });
    }
    if (ganaScore < 3) {
      doshas.push({
        name: 'Gana Dosha',
        severity: ganaScore === 0 ? 'major' : 'mild',
        desc: `${GANA_NAMES[gG]} Gana (${NAKSHATRAS[groomNak].n}) meets ${GANA_NAMES[bG]} Gana (${NAKSHATRAS[brideNak].n}). ${ganaScore === 0
          ? "Opposing Ganas require significant mutual effort to harmonise — one partner’s natural rhythm can feel disruptive to the other. Shared daily routines, a common spiritual practice, and conscious respect for each other’s temperament are essential."
          : "Differing temperamental styles that can complement each other beautifully when both are aware of their natural differences."}`
      });
    }

    const groomRashiName = SIGNS[groomRashi].english;
    const brideRashiName  = SIGNS[brideRashi].english;

    return {
      varna:        { score: varnaScore,   max: 1,  groomVal: VARNA_NAMES[gV],           brideVal: VARNA_NAMES[bV] },
      vasya:        { score: vasyaScore,   max: 2,  groomVal: VASYA_NAMES[gVas],          brideVal: VASYA_NAMES[bVas] },
      tara:         { score: taraScore,    max: 3,  groomVal: groomAusp?'Auspicious':'Inauspicious', brideVal: brideAusp?'Auspicious':'Inauspicious' },
      yoni:         { score: yoniScore,    max: 4,  groomVal: YONI_NAMES[gY],             brideVal: YONI_NAMES[bY] },
      grahaMaitri:  { score: grahaMaitri,  max: 5,  groomVal: LORD_NAMES[gL],             brideVal: LORD_NAMES[bL] },
      gana:         { score: ganaScore,    max: 6,  groomVal: GANA_NAMES[gG],             brideVal: GANA_NAMES[bG] },
      bhakut:       { score: bhakutScore,  max: 7,  groomVal: groomRashiName,             brideVal: brideRashiName, d1, d2 },
      nadi:         { score: nadiScore,    max: 8,  groomVal: NADI_NAMES[gN],             brideVal: NADI_NAMES[bN] },
      total: Math.round(total * 2) / 2,
      maxTotal: 36,
      doshas,
      groomNakName:  NAKSHATRAS[groomNak].n,
      brideNakName:  NAKSHATRAS[brideNak].n,
      groomRashiName,
      brideRashiName
    };
  }

  // ── HTML rendering ──

  function escHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, m =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
  }

  function rowClass(score, max) {
    const r = score / max;
    return r >= 0.75 ? 'koot-good' : r >= 0.4 ? 'koot-mid' : 'koot-bad';
  }

  function renderMilanHTML(p1Name, p1Info, p2Name, p2Info, koot) {
    const { total, maxTotal } = koot;
    const pct = Math.round((total / maxTotal) * 100);

    let vClass, vTitle, vText;
    if (total >= 30) {
      vClass = 'milan-excellent';
      vTitle = 'Exceptionally Auspicious Match';
      vText  = `${total}/36 — this pairing sits in the highest tier of Vedic compatibility. The Moon signs, Nakshatras, and temperamental energies are in deep harmony. Classical Jyotish texts would describe this as a highly auspicious union with strong mutual support across all areas of life.`;
    } else if (total >= 25) {
      vClass = 'milan-good';
      vTitle = 'Good Compatibility';
      vText  = `${total}/36 — a strong and well-aligned match. Most of the eight Koot factors support a harmonious union. Areas with lower scores can be navigated through open communication, awareness of each other's nature, and shared spiritual practice.`;
    } else if (total >= 18) {
      vClass = 'milan-average';
      vTitle = 'Average Compatibility — Workable';
      vText  = `${total}/36 — within the acceptable threshold (18 is the classical minimum recommended). The union is possible with awareness and effort. Consciously working on the areas where Koots score low, and taking the recommended remedies for any doshas, will strengthen the bond.`;
    } else {
      vClass = 'milan-poor';
      vTitle = 'Below Recommended Threshold';
      vText  = `${total}/36 — below the classical minimum of 18. Traditional Jyotish would advise caution and a full chart-level comparison. That said, Ashta Koot is one lens — emotional maturity, shared values, mutual commitment, and genuine love are ultimately the foundation of any marriage. Consult a qualified Jyotishi for a complete horoscope comparison (Porutham, 7th house analysis, Navamsha D9).`;
    }

    const KOOTS = [
      { label:'Varna',        aspect:'Spiritual & social compatibility',       ...koot.varna },
      { label:'Vasya',        aspect:'Natural attraction & influence',          ...koot.vasya },
      { label:'Tara',         aspect:'Destiny, health & birth-star harmony',   ...koot.tara },
      { label:'Yoni',         aspect:'Physical & intimate compatibility',       ...koot.yoni },
      { label:'Graha Maitri', aspect:'Mental & intellectual harmony',           ...koot.grahaMaitri },
      { label:'Gana',         aspect:'Temperament & nature',                   ...koot.gana },
      { label:'Bhakut',       aspect:'Emotional bond, longevity & prosperity', ...koot.bhakut },
      { label:'Nadi',         aspect:'Health, constitution & progeny',         ...koot.nadi }
    ];

    const doshaHtml = koot.doshas.length ? `
      <h3 class="section-title">✦ Doshas Detected in This Match ✦</h3>
      <div class="dosha-grid">
        ${koot.doshas.map(d => `
          <div class="dosha-card ${d.severity==='major'?'sev-strong':d.severity==='significant'?'sev-mod':'sev-mild'}">
            <div class="dosha-title">${escHtml(d.name)}</div>
            <div class="dosha-sev">${escHtml(d.severity)}</div>
            <p class="dosha-desc">${escHtml(d.desc)}</p>
          </div>`).join('')}
      </div>

      <h3 class="section-title">✦ Upaya — Remedies for Compatibility Doshas ✦</h3>
      <div class="universal-block">
        <ul class="universal-list">
          <li><strong>Shiva-Parvati Puja:</strong> The universal remedy for marriage harmony in Jyotish. Both partners should worship together at a Shiva temple on Mondays, especially during Shravan month.</li>
          <li><strong>Navagraha Homa:</strong> A Navagraha fire ritual performed before the wedding propitiates all nine planets simultaneously — highly recommended when any of the three major Koots (Nadi, Bhakut, Gana) shows a dosha.</li>
          <li><strong>Shared Sadhana:</strong> Both partners reciting <em>Om Namah Shivaya</em> together 108 times each morning creates an energetic bond that steadily heals incompatibilities.</li>
          <li><strong>Charity on auspicious days:</strong> Feed brahmins or donate to temples — on Saturdays for Nadi/Bhakut Dosha, on Tuesdays for Gana Dosha.</li>
          <li><strong>Vishnu Sahasranama:</strong> Reciting together on Ekadashi (11th lunar day) is specifically prescribed in classical texts for overcoming Bhakut Dosha.</li>
        </ul>
      </div>` : `
      <h3 class="section-title">✦ No Major Doshas Detected ✦</h3>
      <p class="section-note">None of the three principal Milan doshas (Nadi, Bhakut, Gana) are present in this match. Continue with Shiva-Parvati devotion and a Navagraha Puja before the wedding as an auspicious beginning.</p>`;

    return `
      <div class="milan-header">
        <div class="milan-person">
          <div class="milan-role">Person 1 (Groom / Partner A)</div>
          <div class="milan-person-name">${escHtml(p1Name)}</div>
          <div class="milan-person-sign">${SIGNS[p1Info.rashiIdx].symbol} ${escHtml(SIGNS[p1Info.rashiIdx].english)}</div>
          <div class="milan-person-nak">${escHtml(koot.groomNakName)} Nakshatra</div>
          <div class="milan-person-lagna">Lagna: ${escHtml(SIGNS[p1Info.lagnaIdx].english)}</div>
        </div>
        <div class="milan-heart">♥</div>
        <div class="milan-person">
          <div class="milan-role">Person 2 (Bride / Partner B)</div>
          <div class="milan-person-name">${escHtml(p2Name)}</div>
          <div class="milan-person-sign">${SIGNS[p2Info.rashiIdx].symbol} ${escHtml(SIGNS[p2Info.rashiIdx].english)}</div>
          <div class="milan-person-nak">${escHtml(koot.brideNakName)} Nakshatra</div>
          <div class="milan-person-lagna">Lagna: ${escHtml(SIGNS[p2Info.lagnaIdx].english)}</div>
        </div>
      </div>

      <div class="milan-score-wrap">
        <div class="milan-score-num ${vClass}">${total}<span class="milan-score-denom">/36</span></div>
        <div class="milan-gauge-bg">
          <div class="milan-gauge-fill ${vClass}" style="width:${pct}%"></div>
          <div class="milan-gauge-markers">
            <span style="left:${Math.round(18/36*100)}%">18</span>
            <span style="left:${Math.round(25/36*100)}%">25</span>
            <span style="left:${Math.round(30/36*100)}%">30</span>
          </div>
        </div>
        <div class="milan-verdict-title ${vClass}">${vTitle}</div>
        <p class="milan-verdict-text">${vText}</p>
      </div>

      <h3 class="section-title">✦ Ashta Koot — Eight Compatibility Factors ✦</h3>
      <p class="section-note">Each Koot tests a different dimension of compatibility. The higher the score, the better the alignment on that dimension. Total must exceed 18/36 for a recommended match; 25+ is good; 30+ is exceptional.</p>
      <div class="koot-table-wrap">
        <table class="koot-table">
          <thead>
            <tr>
              <th>Koot</th>
              <th>Dimension</th>
              <th>Person 1</th>
              <th>Person 2</th>
              <th>Score</th>
              <th>Max</th>
            </tr>
          </thead>
          <tbody>
            ${KOOTS.map(k => `
              <tr class="${rowClass(k.score, k.max)}">
                <td><strong>${k.label}</strong></td>
                <td class="koot-dim">${k.aspect}</td>
                <td class="koot-val">${escHtml(k.groomVal)}</td>
                <td class="koot-val">${escHtml(k.brideVal)}</td>
                <td class="koot-score-cell">${k.score}</td>
                <td class="koot-max-cell">${k.max}</td>
              </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr class="koot-total-row">
              <td colspan="4"><strong>Guna Milan Total</strong></td>
              <td class="koot-score-cell ${vClass}"><strong>${total}</strong></td>
              <td class="koot-max-cell"><strong>36</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      ${doshaHtml}
    `;
  }

  window.KundaliMilan = { computeNakshatra, computeKoot, renderMilanHTML };
})();
