# name that! — web

Interactive force-directed map of the practice.  
Source of truth for behaviour: the working HTML prototype (`/prototype/index.html`).  
Architecture spec: `/docs/architecture-spec.md` (v1.0 draft).

## Stack

| Layer | Choice |
|-------|--------|
| CMS | Sanity (Content Lake + Studio) |
| Framework | Astro (islands) |
| Interactive island | React (or Vue) + D3-force |
| Graph physics | d3-force, d3-drag, d3-zoom |
| Styles | CSS variables, no framework |
| Deploy | Incremental rebuild on Sanity webhook |

**Key architectural decision:** nodes are plain HTML elements with `position: absolute; transform: translate(...)` over the SVG (SVG used only for links). No `<foreignObject>` — Safari-friendly.

## Project structure

```
/src
  /components
    /graph
      GraphCanvas.tsx          # D3-force mount + tick loop
      NodeSeed.tsx
      NodeMain.tsx
      NodeLeaf.tsx             # project / research (collapsed)
      NodeQuestion.tsx
      NodeTag.tsx
      Drum.tsx                 # 3D drum (shared)
      DrumFace.tsx
    Header.tsx
    LangToggle.tsx
    Preloader.tsx
  /lib
    graph-state.ts             # activeNodes / reachability collapse
    i18n.ts
    sanity-client.ts
    queries.ts
  /pages
    index.astro                # the map (one big client island)
    projects/[slug].astro      # optional SEO pages (open question)
/sanity
  /schemas
    project.ts
    research.ts
    question.ts
    tag.ts
    practiceInfo.ts
    uiStrings.ts
    localeString.ts
    localeText.ts
    index.ts
/prototype
  index.html                   # original single-file prototype
/docs
  architecture-spec.md
```

## Quick start (local)

```bash
npm install
npm run dev          # Astro
# Sanity Studio: cd sanity && npm run dev
```

## Content model (field-level i18n)

- `project` / `research` — title (untranslated), slug, meta, kind, body, images, tags
- `question` — title (locale), tags, leads → project|research
- `tag` — key + label (locale)
- `practiceInfo` (singleton) — NEXT section
- `uiStrings` (singleton) — all UI labels

Rule: every project/research must be reachable via at least one question’s `leads` field.

## Open questions (from TZ §7)

1. Separate SEO URLs for projects?
2. Soft limit on node count / physics recalibration?
3. Drafts in Sanity?
4. Studio UX for the “must be linked from a question” rule?
5. Preferred host (Vercel / Netlify / …)?

Discuss before full implementation.
