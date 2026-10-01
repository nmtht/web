/**
 * Interactive force-directed map + 3D drum expand.
 * Nodes = HTML. SVG = links only.
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

function nodeSize(d: GraphNode, expanded: Set<string>): { w: number; h: number } {
  if (expanded.has(d.id) && (d.type === 'project' || d.type === 'research')) {
    return { w: 420, h: 360 };
  }
  if (expanded.has(d.id) && d.id === 'next') {
    return { w: 420, h: 360 };
  }
  if (d.type === 'seed') return { w: 420, h: 70 };
  if (d.type === 'main') return { w: 160, h: 56 };
  if (d.type === 'question') return { w: 280, h: 64 };
  if (d.type === 'project' || d.type === 'research') return { w: 220, h: 56 };
  return { w: 120, h: 40 };
}

function drumCardHTML(src: string): string {
  const img = `<img src="${src}" alt="" draggable="false" />`;
  return `<div class="card-face card-front">${img}</div><div class="card-face card-back">${img}</div>`;
}

function drumLabelHTML(content: string): string {
  return `<div class="lbl-face lbl-front"><div class="lbl-inner">${content}</div></div><div class="lbl-face lbl-back"><div class="lbl-inner">${content}</div></div>`;
}

function buildProjectDrumHTML(d: GraphNode): string {
  const urls = d.imageUrls ?? [];
  const n = Math.max(urls.length, 1);
  const R = 150;
  const R2 = 235;
  let html = `<div class="drum-comp" data-drum="1">`;
  html += `<button type="button" class="exp-close" data-close="1" aria-label="Close">×</button>`;
  html += `<div class="drum-scene"><div class="drum-tilt"><div class="drum-ring3d" data-ring="1">`;

  if (urls.length) {
    urls.forEach((src, i) => {
      const ang = i * (360 / n);
      html += `<div class="drum-card3d" style="transform:rotateY(${ang}deg) translateZ(${R}px)">${drumCardHTML(src)}</div>`;
    });
  }

  const labels = [
    `<strong>${d.leafTitle || ''}</strong>${L(d.meta)}${d.meta || d.kind ? ' · ' : ''}${L(d.kind)}`,
    L(d.body),
  ];
  const labelAngles = [60, 180, 300];
  labels.forEach((content, i) => {
    if (!content) return;
    html += `<div class="drum-label3d" style="transform:rotateY(${labelAngles[i]}deg) translateZ(${R2}px)">${drumLabelHTML(content)}</div>`;
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
      s?.url
        ? `<a class="brand-hover" href="${s.url}" target="_blank" rel="noopener">${s.label || s.url}</a>`
        : ''
    )
    .filter(Boolean)
    .join('<br>');

  const R2 = 210;
  const labels = [
    `<span style="font-family:var(--font-display);font-style:italic">${invite}</span><br>${desc}`,
    `<strong>${author}</strong>${role ? ' · ' + role : ''}<br>${bio}`,
    `${L(DEFAULT_UI.contact)}<br>${
      email ? `<a class="brand-hover" href="mailto:${email}">${email}</a><br>` : ''
    }${note}${socials ? '<br>' + socials : ''}`,
  ];
  const labelAngles = [60, 180, 300];

  let html = `<div class="drum-comp" data-drum="1">`;
  html += `<button type="button" class="exp-close" data-close="1" aria-label="Close">×</button>`;
  html += `<div class="drum-scene"><div class="drum-tilt"><div class="drum-ring3d" data-ring="1">`;
  labels.forEach((content, i) => {
    html += `<div class="drum-label3d" style="transform:rotateY(${labelAngles[i]}deg) translateZ(${R2}px)">${drumLabelHTML(content)}</div>`;
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

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    function ensureNode(id: string, parent: GraphNode | null): GraphNode {
      if (nodeById[id]) return nodeById[id];
      const base = db[id];
      if (!base) {
        console.warn('[graph] missing node', id);
        return { id, type: 'tag' };
      }
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
      const r = 210;
      (['that', 'think', 'next'] as const).forEach((id, i) => {
        const rad = (angles[i] * Math.PI) / 180;
        const n = ensureNode(id, null);
        n.x = (seed.x ?? 0) + Math.cos(rad) * r;
        n.y = (seed.y ?? 0) + Math.sin(rad) * r;
        ensureLink('seed', id);
      });
      render();
    }

    function expandMain(mainId: 'that' | 'think') {
      const mainNode = nodeById[mainId];
      if (!mainNode) return;
      questionsForMain(db, mainId).forEach((qid) => {
        ensureNode(qid, mainNode);
        ensureLink(mainId, qid);
      });
      render();
    }

    function activateQuestionLeads(qid: string) {
      const q = db[qid];
      if (!q?.leads) return;
      q.leads.forEach((lid) => {
        ensureNode(lid, nodeById[qid] ?? null);
        ensureLink(qid, lid);
      });
      render();
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
        expanded.delete(n.id);
        return false;
      });
      activeLinks = activeLinks.filter((l) => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        return visited[s] && visited[t];
      });
    }

    function toggleExpand(id: string) {
      if (expanded.has(id)) expanded.delete(id);
      else expanded.add(id);
      render();
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
        render();
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
      if (n.type === 'question') {
        activateQuestionLeads(n.id);
      }
    }

    function wireDrum(wrap: HTMLElement, d: GraphNode) {
      const ring = wrap.querySelector('[data-ring]') as HTMLElement | null;
      const scene = wrap.querySelector('.drum-scene') as HTMLElement | null;
      if (!ring || !scene) return;

      if (d._angle == null) d._angle = 0;
      const apply = () => {
        ring.style.transform = `rotateY(${d._angle}deg)`;
      };
      apply();

      let dragging = false;

      const onPointerDown = (e: PointerEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, a')) return;
        e.stopPropagation();
        e.preventDefault();
        dragging = true;
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
          dragging = false;
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          if (!moved && !target.closest('.drum-card3d, .drum-label3d')) {
            toggleExpand(d.id);
          }
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      };

      scene.addEventListener('pointerdown', onPointerDown);

      const token = {};
      d._animToken = token;
      const tick = () => {
        if (d._animToken !== token) return;
        if (!dragging && expanded.has(d.id)) {
          d._angle = (d._angle ?? 0) + 0.045;
          apply();
        }
        if (expanded.has(d.id) && d._animToken === token) {
          requestAnimationFrame(tick);
        }
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
          .distance(160)
          .strength(0.35)
      )
      .force('charge', d3.forceManyBody().strength(-480))
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
      .on('zoom', (event) => {
        const { x, y, k } = event.transform;
        viewport.setAttribute('transform', `translate(${x},${y}) scale(${k})`);
        nodesLayer.style.transform = `translate(${x}px,${y}px) scale(${k})`;
        nodesLayer.style.transformOrigin = '0 0';
      });

    d3.select(svg).call(zoom as any);
    d3.select(svg).on('dblclick.zoom', null);

    function ticked() {
      const now = performance.now();
      activeNodes.forEach((d) => {
        if (d.fx != null || expanded.has(d.id)) return;
        if (!d._wanderAt || now > d._wanderAt) {
          d._wanderTargetX = (d.x ?? 0) + (Math.random() - 0.5) * 80;
          d._wanderTargetY = (d.y ?? 0) + (Math.random() - 0.5) * 80;
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
        const id = el.dataset.id!;
        const d = nodeById[id];
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
      const cls =
        d.type === 'seed'
          ? 'n-btn n-seed-btn'
          : d.type === 'main'
            ? 'n-btn n-main-btn'
            : d.type === 'question'
              ? 'n-btn n-q-btn'
              : 'n-btn';
      return `<button type="button" class="${cls}">${labelFor(d)}</button>`;
    }

    function expandedHTML(d: GraphNode): string {
      if (d.id === 'next') return buildNextDrumHTML(practice);
      if ((d.type === 'project' || d.type === 'research') && (d.imageUrls?.length ?? 0) > 0) {
        return buildProjectDrumHTML(d);
      }
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
      const linkSel = d3
        .select(linksLayer)
        .selectAll<SVGPathElement, GraphLink>('path.link')
        .data(activeLinks, (d) => {
          const s = typeof d.source === 'object' ? d.source.id : d.source;
          const t = typeof d.target === 'object' ? d.target.id : d.target;
          return `${s}|${t}`;
        });
      linkSel.exit().remove();
      linkSel
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('stroke', '#111110')
        .attr('stroke-opacity', 0.18)
        .attr('stroke-width', 1)
        .attr('fill', 'none');

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
          el.style.position = 'absolute';
          el.style.left = '0';
          el.style.top = '0';
          el.style.pointerEvents = 'auto';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.textAlign = 'center';
          nodesLayer.appendChild(el);
          d3.select(el).datum(d).call(drag as any);

          el.addEventListener('click', (ev) => {
            const t = ev.target as HTMLElement;
            if (t.closest('[data-close]')) {
              expanded.delete(d.id);
              render();
              return;
            }
            if (t.closest('[data-drum]')) return;
            handleNodeClick(nodeById[d.id] || d);
          });
        }

        el.innerHTML = isExp ? expandedHTML(d) : collapsedHTML(d);
        el.classList.toggle('is-expanded', isExp);

        if (isExp && el.querySelector('[data-drum]')) {
          wireDrum(el, d);
        }

        existing.delete(d.id);
      });

      existing.forEach((id) => {
        if (!id) return;
        nodesLayer.querySelector(`[data-id="${CSS.escape(id)}"]`)?.remove();
      });

      simulation.nodes(activeNodes);
      const linkForce = simulation.force('link') as d3.ForceLink<GraphNode, GraphLink>;
      linkForce.links(activeLinks);
      simulation.alpha(0.55).restart();
    }

    const seed = ensureNode('seed', null);
    seed.x = W() / 2;
    seed.y = H() / 2;
    render();

    const resetBtn = document.getElementById('resetMap');
    const onReset = () => {
      activeNodes = [];
      activeLinks = [];
      Object.keys(nodeById).forEach((k) => delete nodeById[k]);
      expanded.clear();
      const s = ensureNode('seed', null);
      s.x = W() / 2;
      s.y = H() / 2;
      d3.select(svg).call(zoom.transform as any, d3.zoomIdentity);
      render();
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
    };
    window.addEventListener('resize', onResize);

    return () => {
      simulation.stop();
      resetBtn?.removeEventListener('click', onReset);
      langBtn?.removeEventListener('click', onLang);
      window.removeEventListener('resize', onResize);
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
        #graphSvg { width: 100%; height: 100%; display: block; cursor: grab; }
        #graphSvg:active { cursor: grabbing; }
        #nodesLayer { position: absolute; inset: 0; pointer-events: none; }
        .graph-node { pointer-events: auto; will-change: transform; }
        .n-btn {
          font: inherit; background: none; border: 0; cursor: pointer;
          color: var(--black); text-align: center;
        }
        .n-seed-btn {
          font-family: var(--font-display); font-style: italic; text-transform: lowercase;
          font-size: clamp(34px, 4.6vw, 58px); line-height: 1; white-space: nowrap;
        }
        .n-main-btn {
          font-family: var(--font-display); font-style: italic; text-transform: lowercase;
          font-size: clamp(26px, 3.2vw, 42px); line-height: 1;
        }
        .n-main-btn:hover { opacity: 0.5; }
        .n-q-btn {
          font-family: var(--font-display); font-style: italic; text-transform: lowercase;
          font-size: 15px; line-height: 1.3; max-width: 270px;
        }
        .n-q-btn:hover { opacity: 0.5; }
        .n-title { display: block; font-size: 16px; line-height: 1.25; }
        .n-meta { display: block; font-size: 10.5px; letter-spacing: 0.02em; margin-top: 4px; }
        .n-project .n-btn, .n-research .n-btn {
          display: flex; flex-direction: column; gap: 4px; max-width: 230px;
        }
        .exp-card {
          position: relative; width: 100%; height: 100%;
          background: #fff; border: 1px solid var(--grey-light);
          padding: 18px 20px; text-align: left; overflow: auto;
          box-sizing: border-box;
        }
        .exp-close {
          position: absolute; top: 10px; right: 12px; font-size: 20px; line-height: 1;
          background: none; border: 0; cursor: pointer; z-index: 5;
        }
        .exp-kicker { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 6px; }
        .exp-title { font-size: 18px; font-weight: 500; margin-bottom: 4px; max-width: 85%; line-height: 1.25; }
        .exp-meta { font-size: 11px; display: flex; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
        .exp-body { font-size: 13.5px; line-height: 1.55; }

        /* ---- 3D drum ---- */
        .drum-comp {
          position: relative; width: 100%; height: 100%;
          background: transparent; cursor: default;
        }
        .drum-scene {
          position: absolute; inset: 0;
          -webkit-perspective: 1500px; perspective: 1500px;
          cursor: grab;
        }
        .drum-scene:active { cursor: grabbing; }
        .drum-tilt {
          width: 100%; height: 100%; position: relative;
          -webkit-transform-style: preserve-3d; transform-style: preserve-3d;
          -webkit-transform: rotateX(54deg); transform: rotateX(54deg);
        }
        .drum-ring3d {
          width: 100%; height: 100%; position: absolute; top: 0; left: 0;
          -webkit-transform-style: preserve-3d; transform-style: preserve-3d;
        }
        .drum-card3d {
          position: absolute; top: 50%; left: 50%;
          width: 132px; height: 90px; margin: -45px 0 0 -66px;
          -webkit-transform-style: preserve-3d; transform-style: preserve-3d;
        }
        .drum-card3d .card-face {
          position: absolute; inset: 0;
          -webkit-backface-visibility: hidden; backface-visibility: hidden;
          overflow: hidden; background: #fff;
          box-shadow: 0 0 0 1px rgba(17,17,16,.18);
        }
        .drum-card3d .card-back {
          -webkit-transform: rotateY(180deg); transform: rotateY(180deg);
        }
        .drum-card3d img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          pointer-events: none; user-select: none;
        }
        .drum-label3d {
          position: absolute; top: 50%; left: 50%;
          width: 170px; margin: -46px 0 0 -85px;
          -webkit-transform-style: preserve-3d; transform-style: preserve-3d;
          text-align: center;
        }
        .drum-label3d .lbl-face {
          position: absolute; top: 0; left: 0; width: 100%;
          -webkit-backface-visibility: hidden; backface-visibility: hidden;
        }
        .drum-label3d .lbl-back {
          -webkit-transform: rotateY(180deg); transform: rotateY(180deg);
        }
        .drum-label3d .lbl-inner {
          font-size: 10.5px; line-height: 1.45; color: var(--black);
        }
        .drum-label3d .lbl-inner strong {
          display: block; font-weight: 500; font-size: 12.5px; margin-bottom: 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          .drum-ring3d { transition: none !important; }
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
