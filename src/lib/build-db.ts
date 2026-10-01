import type { GraphNode, MapContent, SanityImage } from './graph-types';
import { urlFor } from './image-url';

function resolveImages(images?: SanityImage[]): string[] {
  if (!images?.length) return [];
  const urls: string[] = [];
  for (const img of images) {
    const direct = img.asset?.url;
    if (typeof direct === 'string' && direct) {
      urls.push(direct);
      continue;
    }
    const built = urlFor(img as any);
    if (built) urls.push(built);
  }
  return urls;
}

export function buildDb(content: MapContent): Record<string, GraphNode> {
  const db: Record<string, GraphNode> = {
    seed: { id: 'seed', type: 'seed', title: { en: "name what's next.", ru: 'назови, что дальше.' } },
    that: { id: 'that', type: 'main', title: { en: 'THAT!', ru: 'THAT!' } },
    think: { id: 'think', type: 'main', title: { en: 'THINK', ru: 'THINK' } },
    next: { id: 'next', type: 'main', title: { en: 'NEXT', ru: 'NEXT' } },
  };

  for (const p of content?.projects ?? []) {
    db[p._id] = {
      id: p._id,
      type: 'project',
      leafTitle: p.title,
      meta: p.meta,
      kind: p.kind,
      body: p.body,
      parentMain: 'that',
      imageUrls: resolveImages(p.images),
    };
  }

  for (const r of content?.research ?? []) {
    db[r._id] = {
      id: r._id,
      type: 'research',
      leafTitle: r.title,
      meta: r.meta,
      kind: r.kind,
      body: r.body,
      parentMain: 'think',
      imageUrls: resolveImages(r.images),
    };
  }

  for (const q of content?.questions ?? []) {
    const leadIds = (q.leads ?? []).map((l) => l._id).filter(Boolean) as string[];
    db[q._id] = {
      id: q._id,
      type: 'question',
      title: q.title,
      leads: leadIds,
    };
  }

  for (const t of content?.tags ?? []) {
    if (!t.key) continue;
    const id = `tag:${t.key}`;
    db[id] = {
      id,
      type: 'tag',
      tagKey: t.key,
      title: t.label,
    };
  }

  return db;
}

export function questionsForMain(db: Record<string, GraphNode>, mainId: 'that' | 'think'): string[] {
  return Object.keys(db).filter((id) => {
    const n = db[id];
    if (n.type !== 'question' || !n.leads?.length) return false;
    return n.leads.some((lid) => db[lid]?.parentMain === mainId);
  });
}
