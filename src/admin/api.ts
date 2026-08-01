// Talks to the dev-only middleware in src/admin/plugin.ts. These paths are
// served at the dev server root, not under Vite's `base`.

export interface UploadResult {
  path: string;
  bytes: number;
  originalBytes: number;
}

async function unwrap(response: Response) {
  const text = await response.text();
  let payload: any = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    /* fall through to the raw text below */
  }
  if (!response.ok) {
    throw new Error(payload?.error ?? text ?? `request failed (${response.status})`);
  }
  return payload;
}

export const loadContent = () => fetch('/__admin/content').then(unwrap);

export const saveContent = (content: unknown) =>
  fetch('/__admin/content', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content),
  }).then(unwrap);

export const uploadImage = (file: File): Promise<UploadResult> =>
  fetch(`/__admin/upload?name=${encodeURIComponent(file.name)}`, {
    method: 'POST',
    body: file,
  }).then(unwrap);

// site.json stores repo images site-relative; the dev server serves them under
// Vite's base, so previews inside the admin need the same prefix the live site
// applies at runtime.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export const previewSrc = (path: string) => (path.startsWith('/') ? BASE + path : path);

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
