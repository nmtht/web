import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { sanity } from './sanity-client';

const builder = imageUrlBuilder(sanity);

export function urlFor(source: SanityImageSource | null | undefined): string | null {
  if (!source) return null;
  try {
    return builder.image(source).width(800).quality(80).auto('format').url();
  } catch {
    return null;
  }
}
