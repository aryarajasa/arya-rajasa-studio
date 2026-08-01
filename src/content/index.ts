// Single source of truth for all editable site content.
// site.json is edited by the dev-only admin UI at /admin (see src/admin),
// which writes this file directly; nothing user-facing should be hardcoded
// in components. Publishing is a normal git commit + push.
import raw from './site.json';

export interface TextBlock {
  type: 'text';
  heading: string;
  paragraphs: string[];
}

export interface FullBlock {
  type: 'full';
  image: string;
}

export interface GridBlock {
  type: 'grid';
  images: string[];
}

// Ordered, reorderable content of a case study body. Rendered in sequence by
// src/pages/Project.tsx.
export type Block = TextBlock | FullBlock | GridBlock;

export interface CaseStudy {
  intro: string;
  label: string;
  meta: {
    company: string;
    services: string[];
    industry: string;
    year: string;
  };
  hero: string;
  blocks: Block[];
}

export interface Project {
  slug: string;
  name: string;
  details: string;
  image: string;
  caseStudy: CaseStudy;
}

// The CMS stores repo-hosted images as site-relative paths ("/images/x.webp").
// When the site is deployed under a sub-path (GitHub Pages project page),
// those must be prefixed with Vite's base URL — bundler rewriting only covers
// imported assets, not strings coming from JSON at runtime.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const asset = (path: string) => (path.startsWith('/') ? BASE + path : path);

const resolveBlock = (block: Block): Block => {
  switch (block.type) {
    case 'full':
      return { ...block, image: asset(block.image) };
    case 'grid':
      return { ...block, images: block.images.map(asset) };
    default:
      return block;
  }
};

const resolveProject = (project: Project): Project => ({
  ...project,
  image: asset(project.image),
  caseStudy: {
    ...project.caseStudy,
    hero: asset(project.caseStudy.hero),
    blocks: project.caseStudy.blocks.map(resolveBlock),
  },
});

export const content = {
  ...raw,
  projects: (raw.projects as Project[]).map(resolveProject),
  story: { ...raw.story, portrait: asset(raw.story.portrait) },
};

export const projectsList: Project[] = content.projects;

export const findProject = (slug?: string): Project | undefined =>
  projectsList.find((p) => p.slug === slug);
