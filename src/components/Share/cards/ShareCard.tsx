import { forwardRef } from 'react';
import type { CardData, ShareCardId, ShareFormat, ShareTheme } from '@/lib/shareTypes';
import { BigNumberCard } from './BigNumberCard';
import { ChallengeCard } from './ChallengeCard';
import { CheckInCard } from './CheckInCard';
import { GridCard } from './GridCard';
import { MapPosterCard } from './MapPosterCard';
import { MilestoneCard } from './MilestoneCard';
import { TripCard } from './TripCard';

interface Props {
  card: Exclude<ShareCardId, 'set'>;
  format: ShareFormat;
  theme: ShareTheme;
  data: CardData;
}

export const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard({ card, format, theme, data }, ref) {
  const common = { format, theme, data };
  switch (card) {
    case 'map':
      return <MapPosterCard ref={ref} {...common} />;
    case 'grid':
      return <GridCard ref={ref} {...common} />;
    case 'number':
      return <BigNumberCard ref={ref} {...common} />;
    case 'checkin':
      return <CheckInCard ref={ref} {...common} />;
    case 'milestone':
      return <MilestoneCard ref={ref} {...common} />;
    case 'challenge':
      return <ChallengeCard ref={ref} {...common} />;
    case 'trip':
      return <TripCard ref={ref} {...common} />;
  }
});
