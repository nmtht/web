/**
 * Interactive force-directed map + 3D drum expand.
 * Nodes = HTML. SVG = links only.
 * Mobile: focus one branch, fit-to-view, centered drum mode.
 */
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { GraphLink, GraphNode, MapContent } from '../../lib/graph-types';
import { buildDb, questionsForMain } from '../../lib/build-db';
import { DEFAULT_UI, L, getLang, setLang, type Locale } from '../../lib/i18n';

type Props = {
  content?: MapContent;
  fetchError?: string | null;
};

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
}

function nodeSize(d: GraphNode, expanded: Set<string>): { w: number; h: number } {
  const mobile = isMobileViewport();
  if (expanded.has(d.id) && (d.type === 'project' || d.type === 'research')) {
    return mobile
      ? { w: Math.min(window.innerWidth - 24, 360), h: Math.min(window.innerHeight * 0.62, 420) }
      : { w: 560, h: 460 };
  }
  if (expanded.has(d.id) && d.id === 'next') {
    return mobile
      ? { w: Math.min(window.innerWidth - 24, 340), h: Math.min(window.innerHeight * 0.58, 400) }
      : { w: 520, h: 420 };
  }
  if (d.type === 'seed') return mobile ? { w: Math.min(window.innerWidth - 32, 320), h: 56 } : { w: 420, h: 70 };
  if (d.type === 'main') return mobile ? { w: 140, h: 48 } : { w: 160, h: 56 };
  if (d.type === 'question') return mobile ? { w: Math.min(window.innerWidth * 0.72, 260), h: 60 } : { w: 280, h: 64 };
  if (d.type === 'project' || d.type === 'research') return mobile ? { w: 200, h: 52 } : { w: 220, h: 56 };
  return { w: 120, h: 40 };
}

function drumCardHTML(src: string): string {
  const img = `<img src="${src}" alt="" draggable="false" />`;
  return `<div class="card-face card-front">${img}</div><div class="card-face card-back">${img}</div>`;
}

function drumLabelHTML(content: string): string {
  return `<div class="lbl-face lbl-front"><div class="lbl-inner">${content}</div></div><div class="lbl-face lbl-back"><div class="lbl-inner">${content}</div></div>`;
}

function buildFrames(full: string, cutoffLen: number, forced: string): string[] {
  const frames: string[] = [];
  for (let i = full.length; i > cutoffLen; i--) frames.push(full.slice(0, i));
  frames.push(forced);
  return frames;
}

function playFrames(el: HTMLElement, frames: string[], speed: number, onDone?: () => void) {
  const token = {};
  (el as any)._playToken = token;
  let i = 0;
  const step = () => {
    if ((el as any)._playToken !== token) return;
    if (i < frames.length) {
      el.textContent = frames[i];
      i++;
      setTimeout(step, speed);
    } else if (onDone) onDone();
  };
  step();
}

function buildProjectDrumHTML(d: GraphNode): string {
  const urls = d.imageUrls ?? [];
  const n = Math.max(urls.length, 1);
  const R = 200;
  const R2 = 300;
  let html = `<div class="drum-comp" data-drum="1">`;
  html += `<button type="button" class="exp-close" data-close="1" aria-label="Close">×</button>`;
  html += `<div class="drum-scene"><div class="drum-tilt"><div class="drum-ring3d" data-ring="1">`;
  if (urls.length) {
    urls.forEach((src, i) => {
      const ang = i * (360 / n);
      html += `<div class="drum-card3d" data-img-i="${i}" data-ang="${ang}" data-z="${R}" style="transform:rotateY(${ang}deg) translateZ(${R}px)">${drumCardHTML(src)}</div>`;
    });
  }
  const labels = [
    `<strong>${d.leafTitle || ''}</strong>${L(d.meta)}${d.meta || d.kind ? ' · ' : ''}${L(d.kind)}`,
    L(d.body),
  ];
  const labelAngles = [60, 180, 300];
  labels.forEach((content, i) => {
    if (!content) return;
    const ang = labelAngles[i];
    html += `<div class="drum-label3d" data-ang="${ang}" data-z="${R2}" style="transform:rotateY(${ang}deg) translateZ(${R2}px)">${drumLabelHTML(content)}</div>`;
  });
  html += `</div></div></div></div>`;
  return html;
}

function buildNextDrumHTML(practice: MapContent extends null ? never : NonNullable<MapContent>['practiceInfo']): string {
  const invite = L(practice?.inviteLine) || L(DEFAULT_UI.seed);
  const desc = L(practice?.practiceDescription);
  const author = practice?.authorName || '';
  const role = L(practice?.authorRole);
  const bio = L(practice?.authorBio);
  const email = practice?.contactEmail || '';
  const note = L(practice?.contactNote);
  const socials = (practice?.socialLinks ?? [])
    .map((s) =>
      s?.url ? `<a class="brand-hover" href="${s.url}" target="_blank" rel="noopener">${s.label || s.url}</a>` : ''
    )
    .filter(Boolean)
    .join('<br>');
  const R2 = 210;
  const labels = [
    `<span style="font-family:var(--font-display);font-style:italic;font-synthesis:none">${invite}</span><br>${desc}`,
    `<strong>${author}</strong>${role ? ' · ' + role : ''}<br>${bio}`,
    `${L(DEFAULT_UI.contact)}<br>${email ? `<a class="brand-hover" href="mailto:${email}">${email}</a><br>` : ''}${note}${socials ? '<br>' + socials : ''}`,
  ];
  const labelAngles = [60, 180, 300];
  let html = `<div class="drum-comp" data-drum="1">`;
  html += `<button type="button" class="exp-close" data-close="1" aria-label="Close">×</button>`;
  html += `<div class="drum-scene"><div class="drum-tilt"><div class="drum-ring3d" data-ring="1">`;
  labels.forEach((content, i) => {
    const ang = labelAngles[i];
    html += `<div class="drum-label3d" data-ang="${ang}" data-z="${R2}" style="transform:rotateY(${ang}deg) translateZ(${R2}px)">${drumLabelHTML(content)}</div>`;
  });
  html += `</div></div></div></div>`;
  return html;
}

function buildFlatCardHTML(d: GraphNode): string {
  const kicker = d.type === 'project' ? 'THAT!' : 'THINK';
  return `
    <div class="exp-card">
      <button type="button" class="exp-close" data-close="1" aria-label="Close">×</button>
      <div class="exp-kicker">${kicker}</div>
      <div class="exp-title">${d.leafTitle || ''}</div>
      <div class="exp-meta"><span>${L(d.kind)}</span><span>${L(d.meta)}</span></div>
      <p class="exp-body">${L(d.body)}</p>
    </div>`;
}

export default function GraphIsland({ content, fetchError }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current || fetchError) return;

    const root = rootRef.current;
    const svg = root.querySelector('#graphSvg') as SVGSVGElement | null;
    const linksLayer = root.querySelector('#linksLayer') as SVGGElement | null;
    const nodesLayer = root.querySelector('#nodesLayer') as HTMLDivElement | null;
    const viewport = root.querySelector('#viewport') as SVGGElement | null;
    if (!svg || !linksLayer || !nodesLayer || !viewport) return;

    const db = buildDb(content ?? null);
    const practice = content?.practiceInfo;

    let activeNodes: GraphNode[] = [];
    let activeLinks: GraphLink[] = [];
    const nodeById: Record<string, GraphNode> = {};
    const expanded = new Set<string>();
    const parentOf: Record<string, string> = {};
    let mobileFocus = 'seed';
    let transform = d3.zoomIdentity;

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const isMobile = () => isMobileViewport();

    function pathTo(id: string): string[] {
      const path: string[] = [];
      let cur: string | undefined = id;
      const seen = new Set<string>();
      while (cur && !seen.has(cur)) {
        seen.add(cur);
        path.unshift(cur);
        cur = parentOf[cur];
      }
      if (path[0] !== 'seed' && nodeById['seed']) path.unshift('seed');
      return path;
    }

    function drumOpenId(): string | null {
      for (const id of expanded) {
        const n = nodeById[id];
        if (!n) continue;
        if (n.type === 'project' || n.type === 'research' || id === 'next') return id;
      }
      return null;
    }

    function isNodeVisible(n: GraphNode): boolean {
      if (!isMobile()) return true;
      const drum = drumOpenId();
      if (drum) return n.id === drum;
      const path = new Set(pathTo(mobileFocus));
      if (path.has(n.id)) return true;
      return parentOf[n.id] === mobileFocus;
    }

    function ensureNode(id: string, parent: GraphNode | null): GraphNode {
      if (nodeById[id]) return nodeById[id];
      const base = db[id];
      if (!base) return { id, type: 'tag' };
      const n: GraphNode = { ...base, _angle: 0 };
      if (parent) {
        n.x = (parent.x ?? W() / 2) + (Math.random() - 0.5) * 40;
        n.y = (parent.y ?? H() / 2) + (Math.random() - 0.5) * 40;
      } else {
        n.x = W() / 2;
        n.y = H() / 2;
      }
      activeNodes.push(n);
      nodeById[id] = n;
      return n;
    }

    function ensureLink(a: string, b: string) {
      if (!parentOf[b] && a !== b) parentOf[b] = a;
      const exists = activeLinks.some((l) => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        return (s === a && t === b) || (s === b && t === a);
      });
      if (!exists) activeLinks.push({ source: a, target: b });
    }

    function expandSeed() {
      const seed = nodeById['seed'];
      if (!seed) return;
      const angles = [-90, 30, 150];
      const r = isMobile() ? 130 : 210;
      (['that', 'think', 'next'] as const).forEach((id, i) => {
        const rad = (angles[i] * Math.PI) / 180;
        const n = ensureNode(id, seed);
        n.x = (seed.x ?? 0) + Math.cos(rad) * r;
        n.y = (seed.y ?? 0) + Math.sin(rad) * r;
        ensureLink('seed', id);
      });
      mobileFocus = 'seed';
      const seedEl = nodesLayer.querySelector('[data-id="seed"] .n-seed-btn') as HTMLElement | null;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (seedEl && !reduceMotion) {
        const full = L(DEFAULT_UI.seed);
        playFrames(seedEl, buildFrames(full, 1, 'nt!'), 28, () => {
          seedEl.classList.add('is-nt');
          render();
          fitMobileView();
        });
      } else {
        render();
        fitMobileView();
      }
    }

    function expandMain(mainId: 'that' | 'think') {
      const mainNode = nodeById[mainId];
      if (!mainNode) return;
      const qs = questionsForMain(db, mainId);
      const r = isMobile() ? 120 : 180;
      qs.forEach((qid, i) => {
        const n = ensureNode(qid, mainNode);
        const ang = (i - (qs.length - 1) / 2) * (isMobile() ? 0.7 : 0.55);
        n.x = (mainNode.x ?? 0) + Math.sin(ang) * r;
        n.y = (mainNode.y ?? 0) + r * 0.85;
        ensureLink(mainId, qid);
      });
      mobileFocus = mainId;
      render();
      fitMobileView();
    }

    function activateQuestionLeads(qid: string) {
      const q = db[qid];
      if (!q?.leads) return;
      const parent = nodeById[qid] ?? null;
      const leads = q.leads;
      const r = isMobile() ? 110 : 160;
      leads.forEach((lid, i) => {
        const n = ensureNode(lid, parent);
        const ang = (i - (leads.length - 1) / 2) * (isMobile() ? 0.65 : 0.5);
        n.x = (parent?.x ?? W() / 2) + Math.sin(ang) * r;
        n.y = (parent?.y ?? H() / 2) + r * 0.9;
        ensureLink(qid, lid);
      });
      mobileFocus = qid;
      render();
      fitMobileView();
    }

    function reachableExcluding(id: string): Record<string, boolean> {
      const adjacency: Record<string, string[]> = {};
      activeNodes.forEach((n) => {
        adjacency[n.id] = [];
      });
      activeLinks.forEach((l) => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        if (s === id || t === id) return;
        adjacency[s]?.push(t);
        adjacency[t]?.push(s);
      });
      const visited: Record<string, boolean> = { seed: true };
      const queue = ['seed'];
      while (queue.length) {
        const cur = queue.shift()!;
        (adjacency[cur] || []).forEach((nb) => {
          if (!visited[nb]) {
            visited[nb] = true;
            queue.push(nb);
          }
        });
      }
      visited[id] = true;
      return visited;
    }

    function hasDownstream(id: string) {
      const visited = reachableExcluding(id);
      return activeNodes.some((n) => !visited[n.id]);
    }

    function collapseFrom(id: string) {
      const visited = reachableExcluding(id);
      activeNodes = activeNodes.filter((n) => {
        if (visited[n.id]) return true;
        delete nodeById[n.id];
        delete parentOf[n.id];
        expanded.delete(n.id);
        return false;
      });
      activeLinks = activeLinks.filter((l) => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        return visited[s] && visited[t];
      });
      if (!nodeById[mobileFocus]) mobileFocus = id;
      if (!nodeById[mobileFocus]) mobileFocus = 'seed';
    }

    function toggleExpand(id: string) {
      if (expanded.has(id)) {
        expanded.delete(id);
        const n = nodeById[id];
        if (n) {
          n.fx = null;
          n.fy = null;
        }
        mobileFocus = parentOf[id] || 'seed';
      } else {
        if (isMobile()) {
          [...expanded].forEach((eid) => {
            const en = nodeById[eid];
            if (en && (en.type === 'project' || en.type === 'research' || eid === 'next')) {
              expanded.delete(eid);
              en.fx = null;
              en.fy = null;
            }
          });
        }
        expanded.add(id);
        mobileFocus = id;
        if (isMobile()) {
          const n = nodeById[id];
          if (n) {
            n.fx = W() / 2;
            n.fy = H() / 2;
            n.x = n.fx;
            n.y = n.fy;
          }
        }
      }
      render();
      fitMobileView();
    }

    function wireSeedHover() {
      const el = nodesLayer.querySelector('[data-id="seed"]') as HTMLElement | null;
      if (!el || (el as any)._seedHoverWired) return;
      (el as any)._seedHoverWired = true;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.addEventListener('mouseenter', () => {
        if (reduceMotion) return;
        if (hasDownstream('seed')) return;
        const btn = el.querySelector('.n-seed-btn') as HTMLElement | null;
        if (!btn) return;
        playFrames(btn, buildFrames(L(DEFAULT_UI.seed), 1, 'nt!'), 24);
        btn.classList.add('is-nt');
      });
      el.addEventListener('mouseleave', () => {
        if (reduceMotion) return;
        if (hasDownstream('seed')) return;
        const btn = el.querySelector('.n-seed-btn') as HTMLElement | null;
        if (!btn) return;
        btn.classList.remove('is-nt');
        playFrames(btn, buildFrames(L(DEFAULT_UI.seed), 1, 'nt!').slice().reverse(), 24);
      });
    }

    function handleNodeClick(n: GraphNode) {
      if (n.type === 'project' || n.type === 'research') {
        toggleExpand(n.id);
        return;
      }
      if (n.type === 'main' && n.id === 'next') {
        toggleExpand('next');
        return;
      }
      if (hasDownstream(n.id)) {
        collapseFrom(n.id);
        mobileFocus = n.id;
        render();
        fitMobileView();
        return;
      }
      if (n.id === 'seed') {
        expandSeed();
        return;
      }
      if (n.id === 'that' || n.id === 'think') {
        expandMain(n.id);
        return;
      }
      if (n.type === 'question') activateQuestionLeads(n.id);
    }

    function openLightbox(urls: string[], startIndex: number) {
      if (!urls.length) return;
      let idx = Math.max(0, Math.min(startIndex, urls.length - 1));
      document.querySelector('.img-lightbox')?.remove();

      const overlay = document.createElement('div');
      overlay.className = 'img-lightbox';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.innerHTML = `
        <button type="button" class="lb-close" aria-label="Close">×</button>
        <button type="button" class="lb-prev" aria-label="Previous">‹</button>
        <div class="lb-stage"><img class="lb-img" alt="" draggable="false" /></div>
        <button type="button" class="lb-next" aria-label="Next">›</button>
        <div class="lb-counter"></div>
      `;
      document.body.appendChild(overlay);

      const img = overlay.querySelector('.lb-img') as HTMLImageElement;
      const counter = overlay.querySelector('.lb-counter') as HTMLElement;
      const prevBtn = overlay.querySelector('.lb-prev') as HTMLButtonElement;
      const nextBtn = overlay.querySelector('.lb-next') as HTMLButtonElement;

      const show = () => {
        img.src = urls[idx];
        counter.textContent = `${idx + 1} / ${urls.length}`;
        prevBtn.style.visibility = urls.length > 1 ? 'visible' : 'hidden';
        nextBtn.style.visibility = urls.length > 1 ? 'visible' : 'hidden';
      };

      const close = () => {
        window.removeEventListener('keydown', onKey);
        overlay.remove();
      };
      const go = (delta: number) => {
        idx = (idx + delta + urls.length) % urls.length;
        show();
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft') go(-1);
        else if (e.key === 'ArrowRight') go(1);
      };

      overlay.querySelector('.lb-close')!.addEventListener('click', (e) => {
        e.stopPropagation();
        close();
      });
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        go(-1);
      });
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        go(1);
      });
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay || (e.target as HTMLElement).classList.contains('lb-stage')) close();
      });
      window.addEventListener('keydown', onKey);

      let sx = 0;
      img.addEventListener('pointerdown', (e) => {
        sx = e.clientX;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      });
      img.addEventListener('pointerup', (e) => {
        const dx = e.clientX - sx;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      });

      show();
    }

    function wireDrum(wrap: HTMLElement, d: GraphNode) {
      const ring = wrap.querySelector('[data-ring]') as HTMLElement | null;
      const scene = wrap.querySelector('.drum-scene') as HTMLElement | null;
      const comp = wrap.querySelector('.drum-comp') as HTMLElement | null;
      if (!ring || !scene || !comp) return;

      if (!comp.querySelector('[data-drum-move]')) {
        const handle = document.createElement('div');
        handle.className = 'drum-move-handle';
        handle.setAttribute('data-drum-move', '1');
        handle.setAttribute('aria-label', 'Drag to move');
        comp.appendChild(handle);
      }

      if (d._angle == null) d._angle = 0;
      const apply = () => {
        ring.style.transform = `rotateY(${d._angle}deg)`;
        ring.querySelectorAll<HTMLElement>('[data-ang]').forEach((el) => {
          const base = Number(el.getAttribute('data-ang') || 0);
          const z = Number(el.getAttribute('data-z') || 200);
          const rel = (((base + (d._angle || 0)) % 360) + 360) % 360;
          const depth = Math.cos((rel * Math.PI) / 180);
          const scale = 0.78 + 0.28 * ((depth + 1) / 2);
          el.style.transform = `rotateY(${base}deg) translateZ(${z}px) scale(${scale})`;
        });
      };
      apply();

      let rotating = false;
      let moving = false;

      const onPointerDown = (e: PointerEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, a')) return;

        const onFace = !!target.closest('.drum-card3d, .drum-label3d');
        const onMoveHandle = !!target.closest('[data-drum-move]');
        const wantMove = onMoveHandle && !isMobile();

        e.stopPropagation();
        e.preventDefault();

        if (wantMove) {
          moving = true;
          simulation.alphaTarget(0.25).restart();
          const startX = e.clientX;
          const startY = e.clientY;
          const startFx = d.x ?? 0;
          const startFy = d.y ?? 0;
          d.fx = startFx;
          d.fy = startFy;
          const onMove = (ev: PointerEvent) => {
            const dx = (ev.clientX - startX) / transform.k;
            const dy = (ev.clientY - startY) / transform.k;
            d.fx = startFx + dx;
            d.fy = startFy + dy;
            d.x = d.fx;
            d.y = d.fy;
          };
          const onUp = () => {
            moving = false;
            simulation.alphaTarget(0);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
          };
          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
          return;
        }

        rotating = true;
        const startX = e.clientX;
        const startAngle = d._angle ?? 0;
        let moved = false;
        const onMove = (ev: PointerEvent) => {
          const dx = ev.clientX - startX;
          if (Math.abs(dx) > 4) moved = true;
          d._angle = startAngle + dx * 0.4;
          apply();
        };
        const onUp = () => {
          rotating = false;
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          if (moved) return;
          if (onFace) {
            const card = target.closest('.drum-card3d') as HTMLElement | null;
            const urls = d.imageUrls ?? [];
            if (card && urls.length) {
              const i = Number(card.getAttribute('data-img-i') || 0);
              openLightbox(urls, i);
              return;
            }
          }
          if (!onFace) toggleExpand(d.id);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      };

      scene.addEventListener('pointerdown', onPointerDown);

      const token = {};
      d._animToken = token;
      const tick = () => {
        if (d._animToken !== token) return;
        if (!rotating && !moving && expanded.has(d.id)) {
          d._angle = (d._angle ?? 0) + 0.045;
          apply();
        }
        if (expanded.has(d.id) && d._animToken === token) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    const simulation = d3
      .forceSimulation<GraphNode>([])
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>([])
          .id((d) => d.id)
          .distance(() => (isMobile() ? 100 : 160))
          .strength(0.35)
      )
      .force(
        'charge',
        d3.forceManyBody().strength(() => (isMobile() ? -280 : -480))
      )
      .force(
        'collision',
        d3.forceCollide<GraphNode>().radius((d) => {
          const s = nodeSize(d, expanded);
          return Math.max(s.w, s.h) * 0.42;
        })
      )
      .force('x', d3.forceX(W() / 2).strength(0.025))
      .force('y', d3.forceY(H() / 2).strength(0.025))
      .on('tick', ticked);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.35, 2.5])
      .filter((event) => event.type !== 'dblclick')
      .on('zoom', (event) => {
        transform = event.transform;
        const { x, y, k } = transform;
        viewport.setAttribute('transform', `translate(${x},${y}) scale(${k})`);
        nodesLayer.style.transform = `translate(${x}px,${y}px) scale(${k})`;
        nodesLayer.style.transformOrigin = '0 0';
      });

    d3.select(svg).call(zoom as any);
    d3.select(svg).on('dblclick.zoom', null);

    function fitMobileView(force = false) {
      if (!isMobile() && !force) return;
      const visible = activeNodes.filter(isNodeVisible);
      if (!visible.length) return;

      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      visible.forEach((d) => {
        const s = nodeSize(d, expanded);
        const x = d.x ?? W() / 2;
        const y = d.y ?? H() / 2;
        minX = Math.min(minX, x - s.w / 2);
        maxX = Math.max(maxX, x + s.w / 2);
        minY = Math.min(minY, y - s.h / 2);
        maxY = Math.max(maxY, y + s.h / 2);
      });
      const padX = 28;
      const padY = 72;
      const bw = Math.max(maxX - minX, 40);
      const bh = Math.max(maxY - minY, 40);
      const k = Math.min((W() - padX * 2) / bw, (H() - padY * 2) / bh, isMobile() ? 1.15 : 1.4);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const next = d3.zoomIdentity.translate(W() / 2 - k * cx, H() / 2 - k * cy).scale(k);
      d3.select(svg).transition().duration(320).call(zoom.transform as any, next);
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
    };
    root.addEventListener('wheel', onWheel, { passive: false });

    const onNodesWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const point = d3.pointer(e, svg);
      const delta = -e.deltaY * (e.deltaMode === 1 ? 0.05 : e.deltaMode ? 1 : 0.002);
      const k = transform.k * Math.pow(2, delta);
      const clamped = Math.max(0.35, Math.min(2.5, k));
      const x = point[0] - (point[0] - transform.x) * (clamped / transform.k);
      const y = point[1] - (point[1] - transform.y) * (clamped / transform.k);
      d3.select(svg).call(zoom.transform as any, d3.zoomIdentity.translate(x, y).scale(clamped));
    };
    nodesLayer.addEventListener('wheel', onNodesWheel, { passive: false });

    function ticked() {
      const now = performance.now();
      activeNodes.forEach((d) => {
        if (d.fx != null || expanded.has(d.id)) return;
        if (!d._wanderAt || now > d._wanderAt) {
          d._wanderTargetX = (d.x ?? 0) + (Math.random() - 0.5) * (isMobile() ? 40 : 80);
          d._wanderTargetY = (d.y ?? 0) + (Math.random() - 0.5) * (isMobile() ? 40 : 80);
          d._wanderAt = now + 3500 + Math.random() * 2000;
        }
        if (d._wanderTargetX != null && d.x != null && d.y != null) {
          d.x += (d._wanderTargetX - d.x) * 0.006;
          d.y += (d._wanderTargetY! - d.y) * 0.006;
        }
      });
      d3.select(linksLayer)
        .selectAll<SVGPathElement, GraphLink>('path.link')
        .attr('d', (d) => {
          const s = d.source as GraphNode;
          const t = d.target as GraphNode;
          return `M${s.x},${s.y}L${t.x},${t.y}`;
        });
      nodesLayer.querySelectorAll<HTMLElement>('.graph-node').forEach((el) => {
        const d = nodeById[el.dataset.id!];
        if (!d) return;
        const s = nodeSize(d, expanded);
        el.style.transform = `translate(${(d.x ?? 0) - s.w / 2}px, ${(d.y ?? 0) - s.h / 2}px)`;
        el.style.width = `${s.w}px`;
        el.style.height = `${s.h}px`;
      });
    }

    function labelFor(d: GraphNode): string {
      if (d.type === 'project' || d.type === 'research') return d.leafTitle || '';
      if (d.type === 'seed') return L(DEFAULT_UI.seed);
      if (d.id === 'that') return L(DEFAULT_UI.that);
      if (d.id === 'think') return L(DEFAULT_UI.think);
      if (d.id === 'next') return L(DEFAULT_UI.next);
      return L(d.title);
    }

    function collapsedHTML(d: GraphNode): string {
      if (d.type === 'project' || d.type === 'research') {
        return `<button type="button" class="n-btn"><span class="n-title">${d.leafTitle || ''}</span><span class="n-meta">${L(d.kind)}</span></button>`;
      }
      if (d.type === 'seed') {
        const asNt = hasDownstream('seed');
        const cls = asNt ? 'n-btn n-seed-btn is-nt' : 'n-btn n-seed-btn';
        const txt = asNt ? 'nt!' : labelFor(d);
        return `<button type="button" class="${cls}">${txt}</button>`;
      }
      const cls =
        d.type === 'main'
          ? 'n-btn n-main-btn'
          : d.type === 'question'
            ? 'n-btn n-q-btn'
            : 'n-btn';
      return `<button type="button" class="${cls}">${labelFor(d)}</button>`;
    }

    function expandedHTML(d: GraphNode): string {
      if (d.id === 'next') return buildNextDrumHTML(practice);
      if ((d.type === 'project' || d.type === 'research') && (d.imageUrls?.length ?? 0) > 0) return buildProjectDrumHTML(d);
      if (d.type === 'project' || d.type === 'research') return buildFlatCardHTML(d);
      return collapsedHTML(d);
    }

    const drag = d3
      .drag<HTMLElement, GraphNode>()
      .clickDistance(6)
      .on('start', (event, d) => {
        event.sourceEvent?.stopPropagation();
        if (!event.active) simulation.alphaTarget(0.25).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event) => {
        if (!event.active) simulation.alphaTarget(0);
      });

    function render() {
      const visibleLinks = activeLinks.filter((l) => {
        const sId = typeof l.source === 'object' ? l.source.id : l.source;
        const tId = typeof l.target === 'object' ? l.target.id : l.target;
        const sn = nodeById[sId];
        const tn = nodeById[tId];
        if (!sn || !tn) return false;
        return isNodeVisible(sn) && isNodeVisible(tn);
      });

      const linkSel = d3
        .select(linksLayer)
        .selectAll<SVGPathElement, GraphLink>('path.link')
        .data(visibleLinks, (d) => {
          const s = typeof d.source === 'object' ? d.source.id : d.source;
          const t = typeof d.target === 'object' ? d.target.id : d.target;
          return `${s}|${t}`;
        });
      linkSel.exit().remove();
      linkSel.enter().append('path').attr('class', 'link').attr('fill', 'none');

      const existing = new Set(
        Array.from(nodesLayer.querySelectorAll('.graph-node')).map((el) => (el as HTMLElement).dataset.id)
      );

      activeNodes.forEach((d) => {
        let el = nodesLayer.querySelector(`[data-id="${CSS.escape(d.id)}"]`) as HTMLElement | null;
        const isExp = expanded.has(d.id);

        if (!el) {
          el = document.createElement('div');
          el.className = `graph-node n-${d.type}`;
          el.dataset.id = d.id;
          el.style.cssText =
            'position:absolute;left:0;top:0;pointer-events:auto;display:flex;align-items:center;justify-content:center;text-align:center';
          nodesLayer.appendChild(el);
          d3.select(el).datum(d).call(drag as any);
          el.addEventListener('click', (ev) => {
            const t = ev.target as HTMLElement;
            if (t.closest('[data-close]')) {
              expanded.delete(d.id);
              const n = nodeById[d.id];
              if (n) {
                n.fx = null;
                n.fy = null;
              }
              mobileFocus = parentOf[d.id] || 'seed';
              render();
              fitMobileView();
              return;
            }
            if (t.closest('[data-drum]')) return;
            handleNodeClick(nodeById[d.id] || d);
          });
        }

        el.innerHTML = isExp ? expandedHTML(d) : collapsedHTML(d);
        el.classList.toggle('is-expanded', isExp);
        const vis = isNodeVisible(d);
        el.style.visibility = vis ? 'visible' : 'hidden';
        el.style.pointerEvents = vis ? 'auto' : 'none';
        el.setAttribute('aria-hidden', vis ? 'false' : 'true');
        if (isExp && el.querySelector('[data-drum]')) wireDrum(el, d);
        if (isMobile() && isExp && (d.type === 'project' || d.type === 'research' || d.id === 'next')) {
          d.fx = W() / 2;
          d.fy = H() / 2;
          d.x = d.fx;
          d.y = d.fy;
        }
        existing.delete(d.id);
      });

      existing.forEach((id) => {
        if (id) nodesLayer.querySelector(`[data-id="${CSS.escape(id)}"]`)?.remove();
      });

      wireSeedHover();
      simulation.nodes(activeNodes);
      (simulation.force('link') as d3.ForceLink<GraphNode, GraphLink>).links(activeLinks);
      simulation.alpha(0.55).restart();
    }

    const seed = ensureNode('seed', null);
    seed.x = W() / 2;
    seed.y = H() / 2;
    mobileFocus = 'seed';
    render();
    fitMobileView();

    const resetBtn = document.getElementById('resetMap');
    const onReset = () => {
      activeNodes = [];
      activeLinks = [];
      Object.keys(nodeById).forEach((k) => delete nodeById[k]);
      Object.keys(parentOf).forEach((k) => delete parentOf[k]);
      expanded.clear();
      mobileFocus = 'seed';
      const s = ensureNode('seed', null);
      s.x = W() / 2;
      s.y = H() / 2;
      d3.select(svg).call(zoom.transform as any, d3.zoomIdentity);
      transform = d3.zoomIdentity;
      render();
      fitMobileView();
    };
    resetBtn?.addEventListener('click', onReset);
    if (resetBtn) resetBtn.textContent = L(DEFAULT_UI.resetMap);

    const langBtn = document.getElementById('langToggle');
    const onLang = () => {
      const next: Locale = getLang() === 'en' ? 'ru' : 'en';
      setLang(next);
      if (langBtn) langBtn.textContent = next === 'en' ? 'RU' : 'EN';
      if (resetBtn) resetBtn.textContent = L(DEFAULT_UI.resetMap);
      render();
    };
    langBtn?.addEventListener('click', onLang);

    const onResize = () => {
      simulation.force('x', d3.forceX(W() / 2).strength(0.025));
      simulation.force('y', d3.forceY(H() / 2).strength(0.025));
      simulation.alpha(0.3).restart();
      const drum = drumOpenId();
      if (isMobile() && drum && nodeById[drum]) {
        const n = nodeById[drum];
        n.fx = W() / 2;
        n.fy = H() / 2;
        n.x = n.fx;
        n.y = n.fy;
      }
      fitMobileView();
    };
    window.addEventListener('resize', onResize);

    return () => {
      simulation.stop();
      resetBtn?.removeEventListener('click', onReset);
      langBtn?.removeEventListener('click', onLang);
      window.removeEventListener('resize', onResize);
      root.removeEventListener('wheel', onWheel);
      nodesLayer.removeEventListener('wheel', onNodesWheel);
      document.querySelector('.img-lightbox')?.remove();
      nodesLayer.innerHTML = '';
      linksLayer.innerHTML = '';
    };
  }, [content, fetchError]);

  if (fetchError) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', padding: 24 }}>
        <p>Sanity error: {fetchError}</p>
      </div>
    );
  }

  return (
    <div ref={rootRef} id="graph-root" style={{ position: 'fixed', inset: 0, zIndex: 1 }}>
      <style>{`
        #graph-root { touch-action: none; overscroll-behavior: none; }
        #graphSvg { width: 100%; height: 100%; display: block; cursor: grab; touch-action: none; }
        #graphSvg:active { cursor: grabbing; }
        path.link {
          stroke: var(--black);
          stroke-opacity: 0.22;
          stroke-width: 1;
          fill: none;
          transition: stroke 0.35s ease;
        }
        #nodesLayer { position: absolute; inset: 0; pointer-events: none; }
        .graph-node { pointer-events: auto; will-change: transform; }
        .n-btn { font: inherit; background: none; border: 0; cursor: pointer; color: var(--black); text-align: center; }
        .n-seed-btn {
          font-family: var(--font-display);
          font-style: normal;
          font-weight: 400;
          text-transform: lowercase;
          font-synthesis: none;
          font-size: var(--mark-size, clamp(28px, 4vw, 48px));
          line-height: 1;
          white-space: nowrap;
          -webkit-font-smoothing: antialiased;
        }
        .n-seed-btn.is-nt { font-style: italic; }
        .n-main-btn {
          font-family: var(--font-display);
          font-style: normal;
          font-weight: 400;
          text-transform: lowercase;
          font-synthesis: none;
          font-size: clamp(26px, 3.2vw, 42px);
          line-height: 1;
        }
        .n-main-btn:hover { opacity: 0.5; }
        .n-q-btn {
          font-family: var(--font-display);
          font-style: italic;
          font-weight: 400;
          text-transform: lowercase;
          font-synthesis: none;
          font-size: 15px;
          line-height: 1.3;
          max-width: 270px;
        }
        .n-q-btn:hover { opacity: 0.5; }
        .n-title { display: block; font-size: 16px; line-height: 1.25; }
        .n-meta { display: block; font-size: 10.5px; letter-spacing: 0.02em; margin-top: 4px; }
        .n-project .n-btn, .n-research .n-btn { display: flex; flex-direction: column; gap: 4px; max-width: 230px; }
        .exp-card {
          position: relative; width: 100%; height: 100%;
          background: var(--white); border: 1px solid var(--grey-light);
          padding: 18px 20px; text-align: left; overflow: auto; box-sizing: border-box;
          color: var(--black);
        }
        .exp-close { position: absolute; top: 10px; right: 12px; font-size: 20px; line-height: 1; background: none; border: 0; cursor: pointer; z-index: 5; color: var(--black); }
        .exp-kicker { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 6px; }
        .exp-title { font-size: 18px; font-weight: 500; margin-bottom: 4px; max-width: 85%; line-height: 1.25; }
        .exp-meta { font-size: 11px; display: flex; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
        .exp-body { font-size: 13.5px; line-height: 1.55; }
        .drum-comp { position: relative; width: 100%; height: 100%; background: transparent; cursor: default; }
        .drum-scene {
          position: absolute; inset: 0;
          -webkit-perspective: 1100px; perspective: 1100px;
          perspective-origin: 50% 45%;
          cursor: grab;
        }
        .drum-scene:active { cursor: grabbing; }
        .drum-tilt {
          width: 100%; height: 100%; position: relative;
          -webkit-transform-style: preserve-3d; transform-style: preserve-3d;
          -webkit-transform: rotateX(-32deg); transform: rotateX(-32deg);
        }
        .drum-ring3d {
          width: 100%; height: 100%; position: absolute; top: 0; left: 0;
          -webkit-transform-style: preserve-3d; transform-style: preserve-3d;
        }
        .drum-card3d {
          position: absolute; top: 50%; left: 50%;
          width: 200px; height: 140px; margin: -70px 0 0 -100px;
          -webkit-transform-style: preserve-3d; transform-style: preserve-3d;
          cursor: pointer;
        }
        .drum-card3d .card-face {
          position: absolute; inset: 0;
          -webkit-backface-visibility: hidden; backface-visibility: hidden;
          overflow: hidden; background: transparent;
          box-shadow: none; border: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .drum-card3d .card-back { -webkit-transform: rotateY(180deg); transform: rotateY(180deg); }
        .drum-card3d img {
          width: 100%; height: 100%;
          object-fit: contain;
          display: block;
          pointer-events: none;
          user-select: none;
        }
        .drum-label3d {
          position: absolute; top: 50%; left: 50%;
          width: 170px; margin: -46px 0 0 -85px;
          -webkit-transform-style: preserve-3d; transform-style: preserve-3d; text-align: center;
        }
        .drum-label3d .lbl-face {
          position: absolute; top: 0; left: 0; width: 100%;
          -webkit-backface-visibility: hidden; backface-visibility: hidden;
        }
        .drum-label3d .lbl-back { -webkit-transform: rotateY(180deg); transform: rotateY(180deg); }
        .drum-label3d .lbl-inner { font-size: 10.5px; line-height: 1.45; color: var(--black); }
        .drum-label3d .lbl-inner strong { display: block; font-weight: 500; font-size: 12.5px; margin-bottom: 3px; }
        .drum-move-handle {
          position: absolute; left: 50%; top: 50%;
          width: 28px; height: 28px; margin: -14px 0 0 -14px;
          border-radius: 50%; z-index: 4; cursor: grab;
          background: radial-gradient(circle, rgba(17,17,16,0.07) 0%, rgba(17,17,16,0) 72%);
        }
        body.is-inverted .drum-move-handle {
          background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 72%);
        }
        .drum-move-handle:active { cursor: grabbing; }
        .img-lightbox {
          position: fixed; inset: 0; z-index: 2000;
          background: rgba(17,17,16,0.92);
          display: flex; align-items: center; justify-content: center;
          touch-action: none;
        }
        .img-lightbox .lb-stage {
          max-width: min(92vw, 1200px);
          max-height: 88vh;
          display: flex; align-items: center; justify-content: center;
        }
        .img-lightbox .lb-img {
          max-width: 92vw;
          max-height: 88vh;
          width: auto; height: auto;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
        }
        .img-lightbox .lb-close,
        .img-lightbox .lb-prev,
        .img-lightbox .lb-next {
          position: absolute;
          background: none; border: 0; color: #fff;
          cursor: pointer; font-size: 32px; line-height: 1;
          padding: 12px 16px;
          z-index: 2;
        }
        .img-lightbox .lb-close { top: 12px; right: 16px; font-size: 36px; }
        .img-lightbox .lb-prev { left: 8px; top: 50%; transform: translateY(-50%); font-size: 48px; }
        .img-lightbox .lb-next { right: 8px; top: 50%; transform: translateY(-50%); font-size: 48px; }
        .img-lightbox .lb-counter {
          position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
          color: rgba(255,255,255,0.75); font-size: 13px; letter-spacing: 0.06em;
        }
        @media (prefers-reduced-motion: reduce) {
          .drum-ring3d { transition: none !important; }
        }
        @media (max-width: 768px) {
          .n-seed-btn { font-size: clamp(22px, 7vw, 36px); }
          .n-main-btn { font-size: clamp(22px, 6vw, 32px); }
          .n-q-btn { font-size: 14px; max-width: 240px; }
          .drum-card3d {
            width: 150px; height: 105px; margin: -52px 0 0 -75px;
          }
          .drum-label3d {
            width: 140px; margin: -40px 0 0 -70px;
          }
          .drum-label3d .lbl-inner { font-size: 10px; }
          .drum-scene {
            -webkit-perspective: 900px; perspective: 900px;
          }
        }
      `}</style>
      <svg id="graphSvg">
        <g id="viewport">
          <g id="linksLayer" />
        </g>
      </svg>
      <div id="nodesLayer" />
    </div>
  );
}
