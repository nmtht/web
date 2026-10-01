/**
 * Sanity client — used at build time / in Astro server context.
 * Env: PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET
 */

import { createClient } from '@sanity/client';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production';

if (!projectId) {
  console.warn(
    '[sanity-client] PUBLIC_SANITY_PROJECT_ID is missing. Create root .env from .env.example'
  );
}

export const sanity = createClient({
  projectId: projectId || 'placeholder',
  dataset,
  apiVersion: '2025-01-01',
  useCdn: true,
});
