// Astronomical engine for Vedic astrology.
// Computes positions of the Sun, Moon, the five visible planets, and Rahu/Ketu (mean lunar nodes)
// then converts them to sidereal (Nirayana) longitudes using the Lahiri ayanamsa.
// Also computes the Lagna (Ascendant) from local sidereal time and birth latitude.
//
// Accuracy target: ~0.1°-0.5° for the luminaries, ~0.5°-1.5° for the planets — sufficient
// for sign and nakshatra placement in popular Jyotish (the chart looks identical to what a
// professional ephemeris would produce in the overwhelming majority of cases).
//
// References: Jean Meeus, "Astronomical Algorithms" (2nd ed); standard mean-element formulae.

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function norm360(x) {
  x = x % 360;
  return x < 0 ? x + 360 : x;
}

function sind(x) { return Math.sin(x * DEG); }
function cosd(x) { return Math.cos(x * DEG); }
function tand(x) { return Math.tan(x * DEG); }

// ── Julian Day from civil date (Gregorian) + UT hours ──
function julianDay(year, month, day, utHours) {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd = Math.floor(365.25 * (year + 4716))
           + Math.floor(30.6001 * (month + 1))
           + day + B - 1524.5
           + utHours / 24;
  return jd;
}

// ── Lahiri (Chitrapaksha) ayanamsa ──
// Reference: ayanamsa = 23°51'11.4" at J2000.0, drifting ~50.29"/year.
function lahiriAyanamsa(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  // 23.85277778° at J2000 + precession
  return 23.85277778 + 0.0139697222 * T * 100; // T*100 = years from 2000
}

// ── Mean obliquity of the ecliptic ──
function obliquity(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  return 23.439291 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T * T * T;
}

// ── Greenwich Mean Sidereal Time (degrees) ──
function gmst(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  let theta = 280.46061837
            + 360.98564736629 * (jd - 2451545.0)
            + 0.000387933 * T * T
            - T * T * T / 38710000.0;
  return norm360(theta);
}

// ── Local Sidereal Time (degrees) at longitude ──
function lst(jd, longitudeEast) {
  return norm360(gmst(jd) + longitudeEast);
}

// ── Sun: tropical longitude (Meeus chapter 25) ──
function sunLongitude(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sind(M)
          + (0.019993 - 0.000101 * T) * sind(2 * M)
          + 0.000289 * sind(3 * M);
  return norm360(L0 + C);
}

// ── Moon: tropical longitude (truncated ELP — main periodic terms) ──
function moonLongitude(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const Lp = norm360(218.3164477 + 481267.88123421 * T);   // mean longitude
  const D  = norm360(297.8501921 + 445267.1114034 * T);    // mean elongation
  const M  = norm360(357.5291092 + 35999.0502909 * T);     // sun mean anomaly
  const Mp = norm360(134.9633964 + 477198.8675055 * T);    // moon mean anomaly
  const F  = norm360(93.272095   + 483202.0175233 * T);    // argument of latitude

  let dL = 0;
  dL +=  6.288774 * sind(Mp);
  dL +=  1.274027 * sind(2 * D - Mp);
  dL +=  0.658314 * sind(2 * D);
  dL +=  0.213618 * sind(2 * Mp);
  dL += -0.185116 * sind(M);
  dL += -0.114332 * sind(2 * F);
  dL +=  0.058793 * sind(2 * D - 2 * Mp);
  dL +=  0.057066 * sind(2 * D - M - Mp);
  dL +=  0.053322 * sind(2 * D + Mp);
  dL +=  0.045758 * sind(2 * D - M);
  dL += -0.040923 * sind(M - Mp);
  dL += -0.034720 * sind(D);
  dL += -0.030383 * sind(M + Mp);
  dL +=  0.015327 * sind(2 * D - 2 * F);
  dL += -0.012528 * sind(Mp + 2 * F);
  dL +=  0.010980 * sind(Mp - 2 * F);
  dL +=  0.010675 * sind(4 * D - Mp);
  dL +=  0.010034 * sind(3 * Mp);
  dL +=  0.008548 * sind(4 * D - 2 * Mp);
  return norm360(Lp + dL);
}

// ── Rahu (Mean ascending lunar node), tropical longitude ──
function rahuLongitude(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  // Mean longitude of ascending node (Meeus 47.7)
  const omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000;
  return norm360(omega);
}

// ── Planetary positions via Keplerian mean elements + iterative anomaly ──
// Heliocentric ecliptic coordinates (J2000), then geocentric ecliptic longitude.
// Elements from Standish (2003) — adequate for popular astrology accuracy.
const PLANET_ELEMENTS = {
  // a (AU), e, i (deg), L (deg), longPeri (deg), longNode (deg) at J2000.0
  // and centennial rates per Julian century.
  Earth:   { a:1.00000261, da:0.00000562,
             e:0.01671123, de:-0.00004392,
             i:-0.00001531, di:-0.01294668,
             L:100.46457166, dL:35999.37244981,
             lp:102.93768193, dlp:0.32327364,
             ln:0.0, dln:0.0 },
  Mercury: { a:0.38709927, da:0.00000037,
             e:0.20563593, de:0.00001906,
             i:7.00497902, di:-0.00594749,
             L:252.25032350, dL:149472.67411175,
             lp:77.45779628, dlp:0.16047689,
             ln:48.33076593, dln:-0.12534081 },
  Venus:   { a:0.72333566, da:0.00000390,
             e:0.00677672, de:-0.00004107,
             i:3.39467605, di:-0.00078890,
             L:181.97909950, dL:58517.81538729,
             lp:131.60246718, dlp:0.00268329,
             ln:76.67984255, dln:-0.27769418 },
  Mars:    { a:1.52371034, da:0.00001847,
             e:0.09339410, de:0.00007882,
             i:1.84969142, di:-0.00813131,
             L:-4.55343205, dL:19140.30268499,
             lp:-23.94362959, dlp:0.44441088,
             ln:49.55953891, dln:-0.29257343 },
  Jupiter: { a:5.20288700, da:-0.00011607,
             e:0.04838624, de:-0.00013253,
             i:1.30439695, di:-0.00183714,
             L:34.39644051, dL:3034.74612775,
             lp:14.72847983, dlp:0.21252668,
             ln:100.47390909, dln:0.20469106 },
  Saturn:  { a:9.53667594, da:-0.00125060,
             e:0.05386179, de:-0.00050991,
             i:2.48599187, di:0.00193609,
             L:49.95424423, dL:1222.49362201,
             lp:92.59887831, dlp:-0.41897216,
             ln:113.66242448, dln:-0.28867794 }
};

function solveKepler(M, e) {
  // M in radians. Returns eccentric anomaly E in radians.
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 8; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E;
}

// Heliocentric ecliptic XYZ coordinates of a planet at JD (J2000 frame, AU).
function helio(planet, T) {
  const el = PLANET_ELEMENTS[planet];
  const a  = el.a + el.da * T;
  const e  = el.e + el.de * T;
  const i  = (el.i + el.di * T) * DEG;
  const L  = norm360(el.L + el.dL * T) * DEG;
  const lp = norm360(el.lp + el.dlp * T) * DEG;
  const ln = norm360(el.ln + el.dln * T) * DEG;

  const M = L - lp;                          // mean anomaly
  const w = lp - ln;                         // argument of perihelion
  const E = solveKepler(M, e);
  // Position in orbital plane
  const xPrime = a * (Math.cos(E) - e);
  const yPrime = a * Math.sqrt(1 - e * e) * Math.sin(E);
  // Rotate into J2000 ecliptic
  const cw = Math.cos(w), sw = Math.sin(w);
  const cn = Math.cos(ln), sn = Math.sin(ln);
  const ci = Math.cos(i),  si = Math.sin(i);
  const x =  (cw * cn - sw * sn * ci) * xPrime + (-sw * cn - cw * sn * ci) * yPrime;
  const y =  (cw * sn + sw * cn * ci) * xPrime + (-sw * sn + cw * cn * ci) * yPrime;
  const z =  (sw * si)                * xPrime + ( cw * si)                * yPrime;
  return { x, y, z };
}

// Geocentric ecliptic longitude of a planet (tropical, degrees).
function planetLongitude(planet, jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const p = helio(planet, T);
  const e = helio('Earth', T);
  const dx = p.x - e.x;
  const dy = p.y - e.y;
  return norm360(Math.atan2(dy, dx) * RAD);
}

// ── Lagna (Ascendant), tropical, in degrees ──
function ascendantLongitude(jd, latitudeDeg, longitudeEastDeg) {
  const ramc = lst(jd, longitudeEastDeg);  // RA of MC, in degrees
  const eps  = obliquity(jd);
  const phi  = latitudeDeg;
  // Standard formula (Meeus 13.6 / Jyotish texts):
  // tan(asc) = -cos(RAMC) / (sin(eps)*tan(phi) + cos(eps)*sin(RAMC))
  let asc = Math.atan2(
    -cosd(ramc),
    sind(eps) * tand(phi) + cosd(eps) * sind(ramc)
  ) * RAD;
  asc = norm360(asc);
  // The above can land 180° off; correct quadrant so the ASC is on the eastern horizon
  // (must be roughly within +/-180° of RAMC + 90°, since the ASC follows MC by 90° at equator)
  const ramcPlus90 = norm360(ramc + 90);
  if (Math.abs(((asc - ramcPlus90 + 540) % 360) - 180) > 90) asc = norm360(asc + 180);
  return asc;
}

// ── Build a complete chart from birth coordinates / time / timezone ──
// year/month/day are civil date in the local timezone.
// hour/minute are local time of birth (24-hour).
// tzHours is the zone's offset from UTC, in hours (e.g. 5.5 for IST, -5.0 for EST).
function computeChart(year, month, day, hour, minute, lat, lonEast, tzHours) {
  const utHours = hour + minute / 60 - tzHours;
  const jd  = julianDay(year, month, day, utHours);
  const ay  = lahiriAyanamsa(jd);

  const tropical = {
    Sun:     sunLongitude(jd),
    Moon:    moonLongitude(jd),
    Mars:    planetLongitude('Mars', jd),
    Mercury: planetLongitude('Mercury', jd),
    Jupiter: planetLongitude('Jupiter', jd),
    Venus:   planetLongitude('Venus', jd),
    Saturn:  planetLongitude('Saturn', jd),
    Rahu:    rahuLongitude(jd),
  };
  tropical.Ketu = norm360(tropical.Rahu + 180);
  tropical.Lagna = ascendantLongitude(jd, lat, lonEast);

  // Convert to sidereal (Nirayana) by subtracting Lahiri ayanamsa
  const sidereal = {};
  for (const k in tropical) sidereal[k] = norm360(tropical[k] - ay);

  return { jd, ayanamsa: ay, tropical, sidereal, utHours };
}

// Expose to window for browser use (script files load in order).
if (typeof window !== 'undefined') {
  window.Astro = {
    computeChart, julianDay, lahiriAyanamsa, gmst, lst,
    sunLongitude, moonLongitude, planetLongitude, rahuLongitude,
    ascendantLongitude, norm360
  };
}
