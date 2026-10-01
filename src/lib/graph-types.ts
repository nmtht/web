export type LocaleString = { en?: string; ru?: string } | string | null | undefined;

export type SanityImage = {
  asset?: { _ref?: string; _id?: string; url?: string };
  [key: string]: unknown;
};

export type MapContent = {
  projects?: Array<{
    _id: string;
    title?: string;
    slug?: string;
    meta?: LocaleString;
    kind?: LocaleString;
    body?: LocaleString;
    images?: SanityImage[];
    tags?: Array<{ _id?: string; key?: string; label?: LocaleString }>;
  }>;
  research?: Array<{
    _id: string;
    title?: string;
    slug?: string;
    meta?: LocaleString;
    kind?: LocaleString;
    body?: LocaleString;
    images?: SanityImage[];
    tags?: Array<{ _id?: string; key?: string; label?: LocaleString }>;
  }>;
  questions?: Array<{
    _id: string;
    title?: LocaleString;
    tags?: Array<{ _id?: string; key?: string; label?: LocaleString }>;
    leads?: Array<{ _type?: string; _id?: string; title?: string; slug?: string }>;
  }>;
  tags?: Array<{ _id: string; key?: string; label?: LocaleString }>;
  practiceInfo?: {
    inviteLine?: LocaleString;
    practiceDescription?: LocaleString;
    authorName?: string;
    authorRole?: LocaleString;
    authorBio?: LocaleString;
    contactEmail?: string;
    contactNote?: LocaleString;
    socialLinks?: Array<{ label?: string; url?: string }>;
  } | null;
  uiStrings?: Record<string, LocaleString> | null;
} | null;

export type NodeType =
  | 'seed'
  | 'main'
  | 'question'
  | 'project'
  | 'research'
  | 'tag'
  | 'next';

export type GraphNode = {
  id: string;
  type: NodeType;
  title?: LocaleString;
  leafTitle?: string;
  meta?: LocaleString;
  kind?: LocaleString;
  body?: LocaleString;
  leads?: string[];
  parentMain?: 'that' | 'think';
  tagKey?: string;
  /** resolved image URLs for drum */
  imageUrls?: string[];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  _wanderTargetX?: number;
  _wanderTargetY?: number;
  _wanderAt?: number;
  _angle?: number;
  _animToken?: object;
};

export type GraphLink = {
  source: string | GraphNode;
  target: string | GraphNode;
};
