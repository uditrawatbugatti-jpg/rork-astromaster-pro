import * as Astronomy from 'astronomy-engine';

export interface PlanetPosition {
  name: string;
  id: string;
  longitude: number;
  latitude: number;
  speed: number;
  sign: number;
  signName: string;
  degree: number;
  nakshatra: string;
  nakshatraLord: string;
  pada: number;
  house: number;
  isRetrograde: boolean;
}

export interface BirthData {
  date: Date;
  latitude: number;
  longitude: number;
  timezone: string;
  name?: string;
  place?: string;
}

export function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

export function getZodiacSign(longitude: number): number {
  return Math.floor(normalizeAngle(longitude) / 30) + 1;
}

export function getDegreeInSign(longitude: number): number {
  return normalizeAngle(longitude) % 30;
}

export function getNakshatra(longitude: number): { name: string, lord: string, pada: number } {
  const nakshatras = [
    { name: 'Ashwini', lord: 'Ketu' },
    { name: 'Bharani', lord: 'Venus' },
    { name: 'Krittika', lord: 'Sun' },
    { name: 'Rohini', lord: 'Moon' },
    { name: 'Mrigashira', lord: 'Mars' },
    { name: 'Ardra', lord: 'Rahu' },
    { name: 'Punarvasu', lord: 'Jupiter' },
    { name: 'Pushya', lord: 'Saturn' },
    { name: 'Ashlesha', lord: 'Mercury' },
    { name: 'Magha', lord: 'Ketu' },
    { name: 'Purva Phalguni', lord: 'Venus' },
    { name: 'Uttara Phalguni', lord: 'Sun' },
    { name: 'Hasta', lord: 'Moon' },
    { name: 'Chitra', lord: 'Mars' },
    { name: 'Swati', lord: 'Rahu' },
    { name: 'Vishakha', lord: 'Jupiter' },
    { name: 'Anuradha', lord: 'Saturn' },
    { name: 'Jyeshtha', lord: 'Mercury' },
    { name: 'Mula', lord: 'Ketu' },
    { name: 'Purva Ashadha', lord: 'Venus' },
    { name: 'Uttara Ashadha', lord: 'Sun' },
    { name: 'Shravana', lord: 'Moon' },
    { name: 'Dhanishta', lord: 'Mars' },
    { name: 'Shatabhisha', lord: 'Rahu' },
    { name: 'Purva Bhadrapada', lord: 'Jupiter' },
    { name: 'Uttara Bhadrapada', lord: 'Saturn' },
    { name: 'Revati', lord: 'Mercury' },
  ];

  const normalizedLong = normalizeAngle(longitude);
  const nakshatraIndex = Math.floor(normalizedLong / 13.333333);
  const degreeInNakshatra = normalizedLong % 13.333333;
  const pada = Math.floor(degreeInNakshatra / 3.333333) + 1;

  return {
    name: nakshatras[nakshatraIndex].name,
    lord: nakshatras[nakshatraIndex].lord,
    pada,
  };
}

export function calculatePlanetPositions(birthData: BirthData): PlanetPosition[] {
  const { date } = birthData;

  const planets = [
    { id: 'sun', name: 'Sun', body: Astronomy.Body.Sun },
    { id: 'moon', name: 'Moon', body: Astronomy.Body.Moon },
    { id: 'mars', name: 'Mars', body: Astronomy.Body.Mars },
    { id: 'mercury', name: 'Mercury', body: Astronomy.Body.Mercury },
    { id: 'jupiter', name: 'Jupiter', body: Astronomy.Body.Jupiter },
    { id: 'venus', name: 'Venus', body: Astronomy.Body.Venus },
    { id: 'saturn', name: 'Saturn', body: Astronomy.Body.Saturn },
  ];

  const positions: PlanetPosition[] = [];

  const ayanamsa = calculateAyanamsa(date);

  for (const planet of planets) {
    const geoVector = Astronomy.GeoVector(planet.body, date, true);
    const tropicalLong = Math.atan2(geoVector.y, geoVector.x) * 180 / Math.PI;
    const normalizedTropical = normalizeAngle(tropicalLong);
    const siderealLong = normalizeAngle(normalizedTropical - ayanamsa);
    
    const sign = getZodiacSign(siderealLong);
    const degree = getDegreeInSign(siderealLong);
    const nakshatra = getNakshatra(siderealLong);

    const signNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                       'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

    const prevDate = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    const prevGeoVector = Astronomy.GeoVector(planet.body, prevDate, true);
    const prevTropicalLong = Math.atan2(prevGeoVector.y, prevGeoVector.x) * 180 / Math.PI;
    const prevSidereal = normalizeAngle(normalizeAngle(prevTropicalLong) - calculateAyanamsa(prevDate));
    const speed = normalizeAngle(siderealLong - prevSidereal + 180) - 180;

    positions.push({
      name: planet.name,
      id: planet.id,
      longitude: siderealLong,
      latitude: 0,
      speed,
      sign,
      signName: signNames[sign - 1],
      degree,
      nakshatra: nakshatra.name,
      nakshatraLord: nakshatra.lord,
      pada: nakshatra.pada,
      house: 0,
      isRetrograde: speed < 0,
    });
  }

  const rahuTropical = 0;
  const rahuSidereal = normalizeAngle(rahuTropical - ayanamsa);
  const rahuSign = getZodiacSign(rahuSidereal);
  const rahuDegree = getDegreeInSign(rahuSidereal);
  const rahuNakshatra = getNakshatra(rahuSidereal);
  
  const signNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                     'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

  positions.push({
    name: 'Rahu',
    id: 'rahu',
    longitude: rahuSidereal,
    latitude: 0,
    speed: -0.05,
    sign: rahuSign,
    signName: signNames[rahuSign - 1],
    degree: rahuDegree,
    nakshatra: rahuNakshatra.name,
    nakshatraLord: rahuNakshatra.lord,
    pada: rahuNakshatra.pada,
    house: 0,
    isRetrograde: true,
  });

  const ketuSidereal = normalizeAngle(rahuSidereal + 180);
  const ketuSign = getZodiacSign(ketuSidereal);
  const ketuDegree = getDegreeInSign(ketuSidereal);
  const ketuNakshatra = getNakshatra(ketuSidereal);

  positions.push({
    name: 'Ketu',
    id: 'ketu',
    longitude: ketuSidereal,
    latitude: 0,
    speed: -0.05,
    sign: ketuSign,
    signName: signNames[ketuSign - 1],
    degree: ketuDegree,
    nakshatra: ketuNakshatra.name,
    nakshatraLord: ketuNakshatra.lord,
    pada: ketuNakshatra.pada,
    house: 0,
    isRetrograde: true,
  });

  return positions;
}

export function calculateAyanamsa(date: Date): number {
  const J2000 = new Date('2000-01-01T12:00:00Z');
  const daysFromJ2000 = (date.getTime() - J2000.getTime()) / (1000 * 60 * 60 * 24);
  const yearsFromJ2000 = daysFromJ2000 / 365.25;
  
  const ayanamsa = 23.85 + (yearsFromJ2000 * 0.013888888);
  
  return ayanamsa;
}

export function calculateAscendant(birthData: BirthData): number {
  const { date, longitude } = birthData;

  const lst = Astronomy.SiderealTime(date) + (longitude / 15);
  const ramc = (lst * 15) % 360;
  
  const obliquity = 23.4397;
  const cosObliq = Math.cos(obliquity * Math.PI / 180);
  
  const y = Math.sin(ramc * Math.PI / 180) * cosObliq;
  const x = Math.cos(ramc * Math.PI / 180);
  
  let ascendant = Math.atan2(y, x) * 180 / Math.PI;
  if (ascendant < 0) ascendant += 360;
  
  const ayanamsa = calculateAyanamsa(date);
  const siderealAscendant = normalizeAngle(ascendant - ayanamsa);
  
  return siderealAscendant;
}

export function calculateHouses(ascendantLongitude: number): number[] {
  const houses: number[] = [];
  for (let i = 0; i < 12; i++) {
    houses.push(normalizeAngle(ascendantLongitude + (i * 30)));
  }
  return houses;
}

export function assignHousesToPlanets(
  planets: PlanetPosition[],
  ascendantLongitude: number
): PlanetPosition[] {
  return planets.map(planet => {
    let house = Math.floor(normalizeAngle(planet.longitude - ascendantLongitude) / 30) + 1;
    if (house > 12) house -= 12;
    return { ...planet, house };
  });
}

export function calculateNavamsha(longitude: number): number {
  const sign = getZodiacSign(longitude);
  const degreeInSign = getDegreeInSign(longitude);
  
  const navamshaInSign = Math.floor(degreeInSign / 3.333333);
  
  const signIndex = sign - 1;
  const isOddSign = signIndex % 2 === 0;
  
  let navamshaSign: number;
  if (isOddSign) {
    navamshaSign = ((signIndex * 9) + navamshaInSign) % 12 + 1;
  } else {
    navamshaSign = ((signIndex * 9) + navamshaInSign) % 12 + 1;
  }
  
  return navamshaSign;
}
