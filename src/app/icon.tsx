import { ImageResponse } from 'next/og';
import { BrandIcon } from '@/lib/brandIcon';

export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(<BrandIcon size={192} rounded />, size);
}
