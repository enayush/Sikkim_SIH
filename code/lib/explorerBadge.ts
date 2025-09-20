// Explorer Badge Data Model and Logic

import { ImageSourcePropType } from 'react-native';
export type Reward = {
  id: string;
  name: string;
    image: string; // Dummy image URL
  pointsRequired: number;
};

export type ExplorerBadgeProgress = {
  points: number;
  level: number;
  nextLevelPoints: number;
  visitedMonasteries: string[]; // monastery IDs
  bookings: string[]; // booking IDs
};

export const LEVEL_STEP = 100;

export const REWARDS: Reward[] = [
  {
    id: 'badge',
    name: 'Sikkim Badge',
    image: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png', // Tourist badge icon
    pointsRequired: 100,
  },
  {
    id: 'tshirt',
    name: 'Sikkim T-shirt',
    image: 'https://cdn-icons-png.flaticon.com/512/892/892458.png', // T-shirt icon
    pointsRequired: 400,
  },
  {
    id: 'mug',
    name: 'Sikkim Mug',
    image: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png', // Mug icon
    pointsRequired: 300,
  },
];

export function calculateExplorerBadgeProgress(bookings: string[], visitedMonasteries: string[]): ExplorerBadgeProgress {
  const bookingPoints = bookings.length * 20;
  const visitPoints = visitedMonasteries.length * 50;
  const points = bookingPoints + visitPoints;
  const level = Math.floor(points / LEVEL_STEP) + 1;
  const nextLevelPoints = (level * LEVEL_STEP) - points;
  return {
    points,
    level,
    nextLevelPoints,
    visitedMonasteries,
    bookings,
  };
}
