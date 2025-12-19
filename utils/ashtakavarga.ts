import { PlanetPosition } from './astronomical';
import { ASHTAKAVARGA_BENEFIC_POSITIONS } from '@/constants/astrology';

export interface AshtakavargaChart {
  planetId: string;
  planetName: string;
  signPoints: number[];
  totalPoints: number;
}

export function calculateAshtakavarga(planets: PlanetPosition[]): AshtakavargaChart[] {
  const charts: AshtakavargaChart[] = [];

  const mainPlanets = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];

  for (const planetId of mainPlanets) {
    const planet = planets.find(p => p.id === planetId);
    if (!planet) continue;

    const signPoints: number[] = new Array(12).fill(0);

    for (const refPlanetId of mainPlanets) {
      const refPlanet = planets.find(p => p.id === refPlanetId);
      if (!refPlanet) continue;

      const beneficPositions = ASHTAKAVARGA_BENEFIC_POSITIONS[planetId]?.[refPlanetId] || [];

      for (let sign = 1; sign <= 12; sign++) {
        const relativePosition = ((sign - refPlanet.sign + 12) % 12) + 1;
        
        if (beneficPositions.includes(relativePosition)) {
          signPoints[sign - 1] += 1;
        }
      }
    }

    const totalPoints = signPoints.reduce((sum, points) => sum + points, 0);

    charts.push({
      planetId,
      planetName: planet.name,
      signPoints,
      totalPoints,
    });
  }

  return charts;
}

export function getSarvashtakavarga(ashtakavargaCharts: AshtakavargaChart[]): number[] {
  const sarva: number[] = new Array(12).fill(0);

  for (const chart of ashtakavargaCharts) {
    for (let i = 0; i < 12; i++) {
      sarva[i] += chart.signPoints[i];
    }
  }

  return sarva;
}

export function interpretAshtakavarga(signPoints: number[], sign: number): string {
  const points = signPoints[sign - 1];

  if (points >= 6) return 'Excellent';
  if (points >= 4) return 'Good';
  if (points >= 3) return 'Average';
  if (points >= 2) return 'Weak';
  return 'Very Weak';
}
