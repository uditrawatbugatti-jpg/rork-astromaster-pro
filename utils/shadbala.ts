import { PlanetPosition } from './astronomical';
import { EXALTATION_DEBILITATION, PLANET_RELATIONSHIPS } from '@/constants/astrology';

export interface ShadBalaScores {
  planetId: string;
  planetName: string;
  sthanaBala: number;
  digBala: number;
  kalaBala: number;
  cheshtaBala: number;
  naisargikaBala: number;
  drikBala: number;
  totalBala: number;
  totalRupas: number;
  strength: 'Excellent' | 'Good' | 'Average' | 'Weak' | 'Very Weak';
}

export function calculateShadBala(
  planets: PlanetPosition[],
  birthDate: Date
): ShadBalaScores[] {
  const scores: ShadBalaScores[] = [];

  for (const planet of planets) {
    if (planet.id === 'rahu' || planet.id === 'ketu') continue;

    const sthanaBala = calculateSthanaBala(planet);
    const digBala = calculateDigBala(planet);
    const kalaBala = calculateKalaBala(planet, birthDate);
    const cheshtaBala = calculateCheshtaBala(planet);
    const naisargikaBala = calculateNaisargikaBala(planet.id);
    const drikBala = calculateDrikBala(planet, planets);

    const totalBala = sthanaBala + digBala + kalaBala + cheshtaBala + naisargikaBala + drikBala;
    const totalRupas = totalBala / 60;

    let strength: 'Excellent' | 'Good' | 'Average' | 'Weak' | 'Very Weak' = 'Average';
    if (totalRupas >= 10) strength = 'Excellent';
    else if (totalRupas >= 7) strength = 'Good';
    else if (totalRupas >= 5) strength = 'Average';
    else if (totalRupas >= 3) strength = 'Weak';
    else strength = 'Very Weak';

    scores.push({
      planetId: planet.id,
      planetName: planet.name,
      sthanaBala,
      digBala,
      kalaBala,
      cheshtaBala,
      naisargikaBala,
      drikBala,
      totalBala,
      totalRupas,
      strength,
    });
  }

  return scores;
}

function calculateSthanaBala(planet: PlanetPosition): number {
  const exaltData = EXALTATION_DEBILITATION[planet.id];
  if (!exaltData) return 300;

  const exaltLong = exaltData.exaltation;

  let distanceFromExalt = Math.abs(planet.longitude - exaltLong);
  if (distanceFromExalt > 180) distanceFromExalt = 360 - distanceFromExalt;

  const ucchabala = (1 - distanceFromExalt / 180) * 60;

  const ownSignBala = isOwnSign(planet) ? 30 : 0;
  const friendSignBala = isFriendSign(planet) ? 22.5 : 0;

  return ucchabala + ownSignBala + friendSignBala;
}

function calculateDigBala(planet: PlanetPosition): number {
  const digBalaMap: Record<string, number[]> = {
    sun: [10],
    moon: [4],
    mars: [10],
    mercury: [1],
    jupiter: [1],
    venus: [4],
    saturn: [7],
  };

  const favorableHouses = digBalaMap[planet.id] || [];
  const isFavorable = favorableHouses.includes(planet.house);

  return isFavorable ? 60 : 30;
}

function calculateKalaBala(planet: PlanetPosition, birthDate: Date): number {
  const hour = birthDate.getHours();
  const isDayBirth = hour >= 6 && hour < 18;

  const dayRulers = ['sun', 'jupiter', 'venus'];
  const nightRulers = ['moon', 'mars', 'saturn'];

  if (isDayBirth && dayRulers.includes(planet.id)) return 60;
  if (!isDayBirth && nightRulers.includes(planet.id)) return 60;

  return 30;
}

function calculateCheshtaBala(planet: PlanetPosition): number {
  if (planet.isRetrograde) return 60;
  if (Math.abs(planet.speed) > 1) return 45;
  return 30;
}

function calculateNaisargikaBala(planetId: string): number {
  const naisargika: Record<string, number> = {
    sun: 60,
    moon: 51.43,
    venus: 42.86,
    jupiter: 34.29,
    mercury: 25.71,
    mars: 17.14,
    saturn: 8.57,
  };

  return naisargika[planetId] || 30;
}

function calculateDrikBala(planet: PlanetPosition, allPlanets: PlanetPosition[]): number {
  let drikBala = 0;

  for (const otherPlanet of allPlanets) {
    if (otherPlanet.id === planet.id) continue;

    const aspectAngle = Math.abs(planet.longitude - otherPlanet.longitude);
    const normalizedAspect = aspectAngle > 180 ? 360 - aspectAngle : aspectAngle;

    if (Math.abs(normalizedAspect - 180) < 10) {
      drikBala += isFriendly(planet.id, otherPlanet.id) ? 15 : -15;
    } else if (Math.abs(normalizedAspect - 120) < 10) {
      drikBala += isFriendly(planet.id, otherPlanet.id) ? 10 : -10;
    } else if (Math.abs(normalizedAspect - 90) < 10) {
      drikBala += isFriendly(planet.id, otherPlanet.id) ? 7.5 : -7.5;
    } else if (Math.abs(normalizedAspect - 60) < 10) {
      drikBala += isFriendly(planet.id, otherPlanet.id) ? 5 : -5;
    }
  }

  return 30 + drikBala;
}

function isOwnSign(planet: PlanetPosition): boolean {
  const ownSigns: Record<string, number[]> = {
    sun: [5],
    moon: [4],
    mars: [1, 8],
    mercury: [3, 6],
    jupiter: [9, 12],
    venus: [2, 7],
    saturn: [10, 11],
  };

  return ownSigns[planet.id]?.includes(planet.sign) || false;
}

function isFriendSign(planet: PlanetPosition): boolean {
  const friends = PLANET_RELATIONSHIPS[planet.id]?.friends || [];
  
  const signLords: Record<number, string> = {
    1: 'mars', 2: 'venus', 3: 'mercury', 4: 'moon', 5: 'sun', 6: 'mercury',
    7: 'venus', 8: 'mars', 9: 'jupiter', 10: 'saturn', 11: 'saturn', 12: 'jupiter',
  };

  const signLord = signLords[planet.sign];
  return friends.includes(signLord);
}

function isFriendly(planet1: string, planet2: string): boolean {
  const friends = PLANET_RELATIONSHIPS[planet1]?.friends || [];
  return friends.includes(planet2);
}
