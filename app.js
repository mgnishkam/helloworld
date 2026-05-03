// Form handler + results renderer.
// Wires the user's birth details to the astronomy engine and the interpretation engine,
// then paints the chart + doshas + remedies into the page.

(function () {
  'use strict';

  // ── City autocomplete: populate <datalist> from CITIES ──
  const dl = document.getElementById('city-list');
  if (dl) {
    const frag = document.createDocumentFragment();
    for (const c of CITIES) {
      const o = document.createElement('option');
      o.value = `${c.n}, ${c.c}`;
      frag.appendChild(o);
    }
    dl.appendChild(frag);
  }

  // ── Decimal degrees → "12°34'56\"" ──
  function fmtDeg(d) {
    const sign = d < 0 ? '-' : '';
    d = Math.abs(d);
    const deg = Math.floor(d);
    const minF = (d - deg) * 60;
    const min = Math.floor(minF);
    const sec = Math.round((minF - min) * 60);
    return `${sign}${deg}°${String(min).padStart(2,'0')}'${String(sec).padStart(2,'0')}"`;
  }
  function fmtCoord(d, posLabel, negLabel) {
    return `${fmtDeg(Math.abs(d))} ${d >= 0 ? posLabel : negLabel}`;
  }
  function fmtTz(tz) {
    const sign = tz >= 0 ? '+' : '-';
    const h = Math.floor(Math.abs(tz));
    const m = Math.round((Math.abs(tz) - h) * 60);
    return `UTC${sign}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  document.getElementById('astro-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const name        = document.getElementById('name').value.trim();
    const pobRaw      = document.getElementById('pob').value.trim();
    const dobVal      = document.getElementById('dob').value;
    const tobHour     = document.getElementById('tob-hour').value;
    const tobMin      = document.getElementById('tob-min').value;
    const concern     = document.getElementById('concern').value;
    const readingType = document.getElementById('reading-type').value;

    if (!name || !pobRaw || !dobVal || tobHour === '' || tobMin === '') {
      alert('Please fill in your name, place of birth, date of birth, and time of birth — all four are essential for an accurate chart.');
      return;
    }

    const city = findCity(pobRaw);
    if (!city) {
      alert(`We couldn't find "${pobRaw}" in our city database. Please choose a city from the suggestions, or use a nearby major city.`);
      return;
    }

    // Parse hour (was stored as "12 AM" / "1 PM" etc.)
    const hourMatch = tobHour.match(/(\d+)\s*(AM|PM)/i);
    if (!hourMatch) { alert('Please select a valid hour.'); return; }
    let hour = parseInt(hourMatch[1], 10);
    const ampm = hourMatch[2].toUpperCase();
    if (ampm === 'AM' && hour === 12) hour = 0;
    else if (ampm === 'PM' && hour !== 12) hour += 12;
    const minute = parseInt(tobMin, 10);

    const [yyyy, mm, dd] = dobVal.split('-').map(Number);

    // ── Compute the chart ──
    const chart = window.Astro.computeChart(yyyy, mm, dd, hour, minute, city.lat, city.lon, city.tz);
    const sidereal = chart.sidereal;
    const lagnaDecoded = window.Interpret.decodeLongitude(sidereal.Lagna);
    const lagnaSignIdx = lagnaDecoded.signIdx;
    const moonDecoded  = window.Interpret.decodeLongitude(sidereal.Moon);
    const sunDecoded   = window.Interpret.decodeLongitude(sidereal.Sun);

    const positions    = window.Interpret.buildPositions(sidereal, lagnaSignIdx, sidereal.Sun);
    const doshas       = window.Interpret.detectDoshas(positions, lagnaSignIdx, new Date());
    const remedies     = window.Interpret.buildRemedies(doshas, positions);
    const houseRead    = window.Interpret.buildHousePredictions(positions, lagnaSignIdx, concern);
    const dashaResult  = window.Dasha.computeDashas(sidereal.Moon, new Date(yyyy, mm-1, dd));
    const yogas        = window.Yoga.detectYogas(positions, lagnaSignIdx, sidereal);
    const navamsha     = window.Yoga.buildNavamsha(sidereal);
    const aspects      = window.Yoga.buildAspects(positions);
    const aspectInsights = window.Yoga.buildAspectInsights(positions, lagnaSignIdx, aspects);
    const ssVichar     = window.Vichar.buildSadeSatiVichar(moonDecoded.signIdx, moonDecoded, yyyy);
    const ksdVichar    = window.Vichar.buildKaalSarpVichar(positions, lagnaSignIdx);
    const mdVichar     = window.Vichar.buildMangalVichar(positions, lagnaSignIdx);

    const birthDate    = new Date(yyyy, mm-1, dd);
    const yearlyFc     = window.Forecast.buildYearlyForecast(dashaResult, positions, lagnaSignIdx, moonDecoded.signIdx, birthDate);
    const monthlyFc    = window.Forecast.buildMonthlyForecast(dashaResult, positions, lagnaSignIdx, moonDecoded.signIdx, birthDate);

    renderResults({
      name, city, dob: birthDate, readingType,
      hour, minute, concern,
      chart, lagnaDecoded, moonDecoded, sunDecoded,
      positions, doshas, remedies, houseRead, dashaResult,
      yogas, navamsha, aspectInsights,
      ssVichar, ksdVichar, mdVichar,
      yearlyFc, monthlyFc
    });
  });

  function renderResults(d) {
    const r = document.getElementById('results');
    r.style.display = 'block';

    const timeStr = `${String(d.hour).padStart(2,'0')}:${String(d.minute).padStart(2,'0')}`;
    const dateStr = d.dob.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });

    const lagna    = d.lagnaDecoded.sign;
    const moonSign = d.moonDecoded.sign;
    const sunSign  = d.sunDecoded.sign;

    // ── Shared header (used by all three reading types) ──
    const sharedHeader = `
      <div class="result-header">
        <div class="greeting">Namaste, ${escapeHtml(d.name)} 🙏</div>
        <p class="birth-line">
          Born ${dateStr} at ${timeStr} &middot; ${escapeHtml(d.city.n)}, ${escapeHtml(d.city.c)}
        </p>
        <p class="birth-line tiny">
          ${fmtCoord(d.city.lat,'N','S')} &nbsp; ${fmtCoord(d.city.lon,'E','W')} &nbsp; ${fmtTz(d.city.tz)} &nbsp;·&nbsp;
          Ayanamsa (Lahiri): ${d.chart.ayanamsa.toFixed(4)}°
        </p>
      </div>

      <div class="trio-grid">
        ${trioCard('Lagna (Ascendant)', lagna, d.lagnaDecoded, 'Your outer self, body and personality')}
        ${trioCard('Janma Rashi (Moon)', moonSign, d.moonDecoded, 'Your mind, emotions and destiny')}
        ${trioCard('Surya Rashi (Sun)', sunSign, d.sunDecoded, 'Your soul, will and life force')}
      </div>`;

    // ── YEARLY READING ──
    if (d.readingType === 'yearly') {
      let html = sharedHeader;
      html += `
        <h3 class="section-title">✦ Yearly Predictions — Birthday Year ✦</h3>
        <p class="section-note">Predictions from your last birthday to your next birthday, based on the active Vimshottari Dasha periods and the transits of Jupiter, Saturn, and Rahu through your chart houses.</p>
        ${window.Forecast.renderYearlyHTML(d.yearlyFc)}

        <h3 class="section-title">✦ Universal Daily Practices ✦</h3>
        <div class="universal-block">
          <ul class="universal-list">
            <li><strong>Sunrise:</strong> Offer water (Arghya) to the rising Sun while reciting <em>Om Suryaya Namaha</em>.</li>
            <li><strong>Daily:</strong> 10 minutes of pranayama and silent meditation.</li>
            <li><strong>Tuesday &amp; Saturday:</strong> Recite Hanuman Chalisa to neutralise malefic Mars, Saturn, Rahu, and Ketu.</li>
            <li><strong>Service (Seva):</strong> Feed dogs, cows, or birds; serve elders — the most powerful upaya in Jyotish.</li>
          </ul>
        </div>
        <button class="reset-btn" onclick="document.getElementById('results').style.display='none';document.getElementById('astro-form').reset();document.querySelector('.form-section').scrollIntoView({behavior:'smooth'});">✦ New Reading ✦</button>
        <p class="disclaimer">Yearly predictions are based on sidereal transit positions and Vimshottari Dasha timing. For precision timing and specific events, consult a qualified Jyotishi.</p>`;
      r.innerHTML = html;
      r.scrollIntoView({ behavior:'smooth', block:'start' });
      return;
    }

    // ── MONTHLY READING ──
    if (d.readingType === 'monthly') {
      let html = sharedHeader;
      html += `
        <h3 class="section-title">✦ Monthly Predictions ✦</h3>
        <p class="section-note">Predictions for the current month based on the active Pratyantar Dasha sub-period and the monthly transit positions of the Sun, Jupiter, Saturn, and Rahu through your chart houses.</p>
        ${window.Forecast.renderMonthlyHTML(d.monthlyFc)}

        <h3 class="section-title">✦ Universal Daily Practices ✦</h3>
        <div class="universal-block">
          <ul class="universal-list">
            <li><strong>Sunrise:</strong> Offer water (Arghya) to the rising Sun while reciting <em>Om Suryaya Namaha</em>.</li>
            <li><strong>Daily:</strong> 10 minutes of pranayama and silent meditation.</li>
            <li><strong>Tuesday &amp; Saturday:</strong> Recite Hanuman Chalisa to neutralise malefic Mars, Saturn, Rahu, and Ketu.</li>
            <li><strong>Service (Seva):</strong> Feed dogs, cows, or birds; serve elders — the most powerful upaya in Jyotish.</li>
          </ul>
        </div>
        <button class="reset-btn" onclick="document.getElementById('results').style.display='none';document.getElementById('astro-form').reset();document.querySelector('.form-section').scrollIntoView({behavior:'smooth'});">✦ New Reading ✦</button>
        <p class="disclaimer">Monthly predictions are based on Pratyantar Dasha timing and mid-month transit positions. For week-by-week or day-specific guidance, consult a qualified Jyotishi.</p>`;
      r.innerHTML = html;
      r.scrollIntoView({ behavior:'smooth', block:'start' });
      return;
    }

    // ── GENERAL LIFETIME READING (default) ──
    let html = sharedHeader + `
      <h3 class="section-title">✦ Planetary Positions (Graha Sthiti) ✦</h3>
      <div class="table-wrap">
        <table class="planet-table">
          <thead>
            <tr>
              <th>Graha</th><th>Sign (Rashi)</th><th>Degree</th><th>House</th>
              <th>Nakshatra (Pada)</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${d.positions.map(planetRow).join('')}
          </tbody>
        </table>
      </div>

      <h3 class="section-title">✦ Navamsha — D9 Divisional Chart ✦</h3>
      <p class="section-note">The Navamsha (D9) is the most important divisional chart in Jyotish. It reveals the inner strength of each planet and is essential for understanding marriage, deeper character, and whether birth-chart promises will bear fruit. A Vargottama planet (same sign in D1 &amp; D9) is exceptionally powerful.</p>
      ${window.Yoga.renderNavamshaHTML(d.navamsha)}

      <h3 class="section-title">✦ Planetary Aspects (Graha Drishti) ✦</h3>
      <p class="section-note">In Vedic astrology all planets cast a full aspect on the 7th house. Mars additionally aspects the 4th &amp; 8th; Jupiter the 5th &amp; 9th; Saturn the 3rd &amp; 10th. Notable patterns in your chart:</p>
      ${window.Yoga.renderAspectsHTML(d.aspectInsights)}

      <h3 class="section-title">✦ Reading for ${escapeHtml(concernTitle(d.concern))} ✦</h3>
      <div class="house-grid">
        ${d.houseRead.map(houseCard).join('')}
      </div>

      <h3 class="section-title">✦ Vimshottari Dasha — Your Planetary Periods ✦</h3>
      <p class="section-note">The Dasha system is Jyotish's timing engine — it tells you <em>when</em> chart promises ripen. The Mahadasha is the major period (years), the Antardasha the sub-period (months), and the Pratyantar the current fortnight-scale influence.</p>
      <div id="dasha-section">
        ${window.Dasha.renderDashaHTML(d.dashaResult)}
      </div>

      <h3 class="section-title">✦ Yogas in Your Chart ✦</h3>
      <p class="section-note">Yogas are planetary combinations that amplify or challenge specific life themes. Auspicious yogas are latent gifts waiting to be activated — especially during the Dasha of the planets involved.</p>
      ${window.Yoga.renderYogasHTML(d.yogas)}
    `;

    if (d.doshas.length) {
      html += `
        <h3 class="section-title">✦ Adverse Influences Detected (Doshas) ✦</h3>
        <div class="dosha-grid">
          ${d.doshas.map(doshaCard).join('')}
        </div>

        <h3 class="section-title">✦ Recommended Remedies (Upaya) ✦</h3>
        <p class="section-note">Vedic remedies work by gradually re-tuning your relationship with the responsible graha. Sincerity and consistency matter more than intensity. Begin with one or two practices and let them become natural before adding more.</p>
        <div class="remedy-grid">
          ${d.remedies.map(remedyCard).join('')}
        </div>
      `;
    } else {
      html += `
        <h3 class="section-title">✦ Auspicious Chart ✦</h3>
        <p class="section-note">No major doshas detected in this chart. The grahas are well placed; continue your spiritual practices and treat each planet's auspicious day with reverence to maintain this harmony.</p>
      `;
    }

    // Dosha Vichar
    html += `
      <h3 class="section-title">✦ Shani Sade Sati — Deep Vichar ✦</h3>
      <p class="section-note">Sade Sati is the seven-and-a-half-year transit of Saturn through the 12th, 1st and 2nd houses from your natal Moon. Each person experiences it 2–3 times in a lifetime. Below is a detailed reading based on your Janma Rashi and the present Saturn position.</p>
      ${window.Vichar.renderSadeSatiHTML(d.ssVichar)}

      <h3 class="section-title">✦ Kaal Sarp Dosha — Deep Vichar ✦</h3>
      <p class="section-note">Kaal Sarp Dosha forms when all seven visible planets are hemmed between the Rahu-Ketu nodal axis. Tradition assigns 12 named types — each with distinct karmic terrain, life themes, and remedies.</p>
      ${window.Vichar.renderKaalSarpHTML(d.ksdVichar)}

      <h3 class="section-title">✦ Mangal Dosha — Deep Vichar ✦</h3>
      <p class="section-note">Mangal Dosha arises when Mars occupies the 1st, 2nd, 4th, 7th, 8th, or 12th house from Lagna, Moon, or Venus. Traditional astrology assesses it from all three reference points for a complete picture.</p>
      ${window.Vichar.renderMangalHTML(d.mdVichar)}
    `;

    // Universal daily practices
    html += `
      <h3 class="section-title">✦ Universal Daily Practices ✦</h3>
      <div class="universal-block">
        <ul class="universal-list">
          <li><strong>Sunrise:</strong> Offer water (Arghya) to the rising Sun while reciting <em>Om Suryaya Namaha</em>.</li>
          <li><strong>Daily:</strong> 10 minutes of pranayama and silent meditation — calms all nine grahas at once.</li>
          <li><strong>Tuesday & Saturday:</strong> Recite Hanuman Chalisa to neutralise the malefic effects of Mars, Saturn, Rahu and Ketu.</li>
          <li><strong>Daily anchor mantra:</strong> <em>Mahamrityunjaya Mantra</em> — Om Tryambakam Yajamahe, Sugandhim Pushtivardhanam, Urvarukamiva Bandhanan, Mrityor Mukshiya Maamritat — recited 11 or 108 times protects from all planetary afflictions.</li>
          <li><strong>Service (Seva):</strong> Feed dogs, cows, ants, or birds; serve elders. Genuine service is the most powerful upaya in Jyotish.</li>
          <li><strong>Speech:</strong> Avoid harsh, untrue, and unnecessary speech — Mercury and Jupiter both bless those who speak well.</li>
        </ul>
      </div>

      <button class="reset-btn" onclick="document.getElementById('results').style.display='none';document.getElementById('astro-form').reset();document.querySelector('.form-section').scrollIntoView({behavior:'smooth'});">✦ New Reading ✦</button>

      <p class="disclaimer">
        Chart computed from your local birth time, geographic coordinates, and Lahiri ayanamsa.
        Planetary positions are accurate to within ~1° — adequate for sign and nakshatra placement.
        For major life decisions, consult a qualified Jyotishi who can apply Dasha analysis,
        Divisional Charts (Vargas), and Ashtakavarga to your unique chart.
      </p>
    `;

    r.innerHTML = html;
    r.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  function trioCard(label, sign, decoded, sub) {
    return `
      <div class="trio-card">
        <div class="trio-label">${label}</div>
        <div class="trio-symbol">${sign.symbol}</div>
        <div class="trio-name">${sign.name}</div>
        <div class="trio-eng">${sign.english} · ruled by ${sign.lord}</div>
        <div class="trio-deg">${fmtDeg(decoded.degInSign)}</div>
        <div class="trio-nak">${decoded.nakshatra.n} · Pada ${decoded.pada}</div>
        <div class="trio-sub">${sub}</div>
      </div>`;
  }

  function planetRow(p) {
    const dignityClass = ['exalted','own sign','moolatrikona','friendly'].includes(p.dignity) ? 'good'
                       : ['debilitated','inimical'].includes(p.dignity) ? 'bad'
                       : '';
    const status = p.combust ? `${p.dignity}, combust` : p.dignity;
    return `
      <tr>
        <td><strong>${p.planet}</strong></td>
        <td>${p.sign.symbol} ${p.sign.name}</td>
        <td>${fmtDeg(p.degInSign)}</td>
        <td>${p.house}</td>
        <td>${p.nakshatra.n} (${p.pada})</td>
        <td class="${dignityClass}">${status}</td>
      </tr>`;
  }

  function houseCard(h) {
    return `
      <div class="house-card">
        <div class="house-num">${h.house}<span class="ord">${ord(h.house)}</span></div>
        <div class="house-theme">${escapeHtml(h.theme)}</div>
        <div class="house-meta">Lord: <strong>${h.lord}</strong> &nbsp;·&nbsp; Occupants: ${escapeHtml(h.occupants)}</div>
        <p class="house-reading">${escapeHtml(h.reading)}</p>
      </div>`;
  }

  function doshaCard(d) {
    const sevClass = d.severity === 'strong' ? 'sev-strong'
                   : d.severity === 'moderate' ? 'sev-mod'
                   : 'sev-mild';
    return `
      <div class="dosha-card ${sevClass}">
        <div class="dosha-title">${escapeHtml(d.name)}</div>
        <div class="dosha-sev">${d.severity}</div>
        <p class="dosha-desc">${escapeHtml(d.description)}</p>
      </div>`;
  }

  function remedyCard(r) {
    return `
      <div class="remedy-card">
        <div class="remedy-title">For ${escapeHtml(r.title)}</div>
        <ul class="remedy-list">
          ${r.items.map(i => `<li>${i}</li>`).join('')}
        </ul>
      </div>`;
  }

  function ord(n) {
    const s = ['th','st','nd','rd'], v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }
  function concernTitle(c) {
    return ({ career:'Career & Wealth', love:'Love & Relationships', health:'Health & Wellbeing',
              spiritual:'Spiritual Growth', general:'General Life' })[c] || 'General Life';
  }
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[m]);
  }
})();
