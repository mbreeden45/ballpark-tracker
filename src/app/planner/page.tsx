import type { Metadata } from 'next';
import { PlannerApp } from '@/components/planner/PlannerApp';

export const metadata: Metadata = {
  title: 'Trip Planner — Ballpark Passport',
  description: 'Plan a realistic multi-city baseball road trip around the MLB schedule, your passport and your favorite teams.',
};

export default function Page() {
  return <PlannerApp />;
}
