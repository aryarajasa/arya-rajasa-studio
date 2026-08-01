import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Connect, Plugin, ResolvedConfig } from 'vite';

// Dev-only API backing the /admin editor. It is registered with
// `apply: 'serve'`, so it never exists in a production build — the deployed
// site stays a plain static bundle with no write endpoint.

const CONTENT_FILE = 'src/content/site.json';
const IMAGE_DIR = 'public/images';
// Long edge cap for uploads. Big enough for full-bleed hero images on a
// retina display, small enough to keep the repo from ballooning.
const MAX_EDGE = 2000;
const WEBP_QUALITY = 82;
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const readBody = (req: Connect.IncomingMessage, limit: number) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error(`payload exceeds ${Math.round(limit / 1024 / 1024)}MB`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Reject anything that isn't shaped like the site content before overwriting
// the file — a malformed write would break the dev server and the build.
function validate(data: unknown): string | null {
  if (!data || typeof data !== 'object') return 'content must be an object';
  const site = data as Record<string, unknown>;
  if (!Array.isArray(site.projects)) return 'content.projects must be an array';

  const slugs = new Set<string>();
  for (const [i, entry] of site.projects.entries()) {
    const project = entry as Record<string, unknown>;
    if (!project || typeof project !== 'object') return `project ${i} is not an object`;
    if (typeof project.slug !== 'string' || !project.slug) return `project ${i} is missing a slug`;
    if (!/^[a-z0-9-]+$/.test(project.slug)) {
      return `project "${project.slug}" has an invalid slug (use lowercase letters, numbers and dashes)`;
    }
    if (slugs.has(project.slug)) return `duplicate slug "${project.slug}"`;
    slugs.add(project.slug);
    if (typeof project.name !== 'string') return `project "${project.slug}" is missing a name`;
    if (typeof project.image !== 'string') return `project "${project.slug}" is missing an image`;

    const caseStudy = project.caseStudy as Record<string, unknown> | undefined;
    if (!caseStudy || typeof caseStudy !== 'object') return `project "${project.slug}" is missing caseStudy`;
    if (!Array.isArray(caseStudy.blocks)) return `project "${project.slug}" has no caseStudy.blocks array`;
    for (const [j, raw] of caseStudy.blocks.entries()) {
      const block = raw as Record<string, unknown>;
      if (!block || typeof block !== 'object') return `project "${project.slug}" block ${j} is not an object`;
      if (block.type === 'text') {
        if (!Array.isArray(block.paragraphs)) return `project "${project.slug}" block ${j} needs paragraphs`;
      } else if (block.type === 'full') {
        if (typeof block.image !== 'string') return `project "${project.slug}" block ${j} needs an image`;
      } else if (block.type === 'grid') {
        if (!Array.isArray(block.images)) return `project "${project.slug}" block ${j} needs images`;
      } else {
        return `project "${project.slug}" block ${j} has unknown type "${String(block.type)}"`;
      }
    }
  }
  return null;
}

export default function adminApi(): Plugin {
  let root = process.cwd();

  return {
    name: 'studio-admin-api',
    apply: 'serve',

    configResolved(config: ResolvedConfig) {
      root = config.root;
    },

    configureServer(server) {
      const contentPath = path.join(root, CONTENT_FILE);
      const imageDir = path.join(root, IMAGE_DIR);

      const send = (res: any, status: number, body: unknown) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(body));
      };

      server.middlewares.use('/__admin/content', async (req, res, next) => {
        try {
          if (req.method === 'GET') {
            const text = await fs.readFile(contentPath, 'utf8');
            res.setHeader('Content-Type', 'application/json');
            res.end(text);
            return;
          }

          if (req.method === 'PUT') {
            const body = await readBody(req, MAX_UPLOAD_BYTES);
            let parsed: unknown;
            try {
              parsed = JSON.parse(body.toString('utf8'));
            } catch {
              send(res, 400, { error: 'body is not valid JSON' });
              return;
            }

            const problem = validate(parsed);
            if (problem) {
              send(res, 400, { error: problem });
              return;
            }

            await fs.writeFile(contentPath, JSON.stringify(parsed, null, 2) + '\n', 'utf8');
            send(res, 200, { ok: true });
            return;
          }

          next();
        } catch (error) {
          send(res, 500, { error: (error as Error).message });
        }
      });

      server.middlewares.use('/__admin/upload', async (req, res, next) => {
        if (req.method !== 'POST') return next();
        try {
          const url = new URL(req.url ?? '', 'http://localhost');
          // Only the caller-supplied basename is used, and it is slugified —
          // never joined raw, so an upload cannot escape public/images.
          const hint = slugify(path.parse(url.searchParams.get('name') ?? 'image').name) || 'image';
          const body = await readBody(req, MAX_UPLOAD_BYTES);

          const { default: sharp } = await import('sharp');
          const image = sharp(body, { failOn: 'error' });
          const meta = await image.metadata();
          if (!meta.width || !meta.height) {
            send(res, 400, { error: 'could not read that file as an image' });
            return;
          }

          const longEdge = Math.max(meta.width, meta.height);
          const pipeline =
            longEdge > MAX_EDGE
              ? image.resize({
                  width: meta.width >= meta.height ? MAX_EDGE : undefined,
                  height: meta.height > meta.width ? MAX_EDGE : undefined,
                  withoutEnlargement: true,
                })
              : image;

          const output = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();

          await fs.mkdir(imageDir, { recursive: true });
          const filename = `${hint}-${crypto.randomBytes(4).toString('hex')}.webp`;
          await fs.writeFile(path.join(imageDir, filename), output);

          send(res, 200, {
            path: `/images/${filename}`,
            bytes: output.length,
            originalBytes: body.length,
            width: Math.min(meta.width, longEdge > MAX_EDGE ? MAX_EDGE : meta.width),
          });
        } catch (error) {
          send(res, 500, { error: (error as Error).message });
        }
      });
    },
  };
}
