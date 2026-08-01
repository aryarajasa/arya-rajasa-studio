import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Project } from '../content';
import { loadContent, previewSrc, saveContent } from './api';
import ProjectEditor from './ProjectEditor';
import { IconButton } from './fields';

// Writing site.json makes Vite reload this page (the JSON is part of the module
// graph). Selection lives in the URL so it survives, and this flag carries the
// success message across the reload.
const SAVED_FLAG = 'studio-admin-just-saved';

const emptyProject = (existing: Project[]): Project => {
  let slug = 'new-project';
  let n = 2;
  while (existing.some((p) => p.slug === slug)) slug = `new-project-${n++}`;
  return {
    slug,
    name: 'new project',
    details: '',
    image: '',
    caseStudy: {
      intro: '',
      label: 'case study',
      meta: { company: '', services: [], industry: '', year: String(new Date().getFullYear()) },
      hero: '',
      blocks: [],
    },
  };
};

export default function AdminApp() {
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(() => sessionStorage.getItem(SAVED_FLAG) === '1');

  useEffect(() => {
    sessionStorage.removeItem(SAVED_FLAG);
    loadContent().then(setData, (e) => setLoadError(e.message));
  }, []);

  const projects: Project[] = data?.projects ?? [];
  const selectedSlug = decodeURIComponent(location.pathname.replace(/^\/admin\/?/, ''));
  const selectedIndex = projects.findIndex((p) => p.slug === selectedSlug);
  const selected = selectedIndex >= 0 ? projects[selectedIndex] : undefined;

  const setProjects = useCallback((next: Project[]) => {
    setData((current: any) => ({ ...current, projects: next }));
    setDirty(true);
    setSaved(false);
  }, []);

  const save = useCallback(async () => {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveContent(data);
      sessionStorage.setItem(SAVED_FLAG, '1');
      setSaved(true);
      setDirty(false);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [data]);

  // Ctrl/Cmd+S saves, like any editor.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  // Warn before losing unsaved edits to a browser navigation or reload.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const duplicateSlugs = useMemo(() => {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const p of projects) {
      if (seen.has(p.slug)) dupes.add(p.slug);
      seen.add(p.slug);
    }
    return dupes;
  }, [projects]);

  if (loadError) {
    return (
      <div className="p-8 text-sm text-red-600">
        could not load site.json — {loadError}
      </div>
    );
  }
  if (!data) return <div className="p-8 text-sm text-neutral-400">loading…</div>;

  const addProject = () => {
    const project = emptyProject(projects);
    setProjects([...projects, project]);
    navigate(`/admin/${project.slug}`);
  };

  const removeProject = (index: number) => {
    const project = projects[index];
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone once saved.`)) return;
    const next = projects.filter((_, i) => i !== index);
    setProjects(next);
    if (project.slug === selectedSlug) {
      navigate(next.length ? `/admin/${next[Math.max(0, index - 1)].slug}` : '/admin');
    }
  };

  const moveProject = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= projects.length) return;
    const next = [...projects];
    [next[index], next[target]] = [next[target], next[index]];
    setProjects(next);
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-neutral-50 text-neutral-900">
      <header className="flex items-center justify-between gap-4 px-6 py-3 border-b border-neutral-200 bg-white shrink-0">
        <div className="flex items-baseline gap-3">
          <span className="text-sm">project editor</span>
          <a href={import.meta.env.BASE_URL} className="text-xs text-neutral-400 hover:text-neutral-900">
            view site ↗
          </a>
        </div>
        <div className="flex items-center gap-3">
          {saveError && <span className="text-xs text-red-600 max-w-md truncate">{saveError}</span>}
          {!saveError && saved && <span className="text-xs text-green-700">saved to site.json</span>}
          {dirty && !saving && <span className="text-xs text-amber-600">unsaved changes</span>}
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="bg-neutral-900 text-white px-4 py-1.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {saving ? 'saving…' : 'save'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <aside className="w-64 shrink-0 border-r border-neutral-200 bg-white overflow-y-auto">
          <div className="p-3 flex flex-col gap-1">
            {projects.map((project, i) => (
              <div
                key={`${project.slug}-${i}`}
                className={`group flex items-center gap-2 px-2 py-2 cursor-pointer ${
                  project.slug === selectedSlug ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                }`}
                onClick={() => navigate(`/admin/${project.slug}`)}
              >
                <div className="w-10 h-8 bg-neutral-100 overflow-hidden shrink-0">
                  {project.image && (
                    <img src={previewSrc(project.image)} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs truncate">{project.name || '(untitled)'}</div>
                  <div className="text-[10px] text-neutral-400 truncate">
                    {duplicateSlugs.has(project.slug) ? (
                      <span className="text-red-600">duplicate slug</span>
                    ) : (
                      `/${project.slug}`
                    )}
                  </div>
                </div>
                <div
                  className="hidden group-hover:flex gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconButton title="move up" onClick={() => moveProject(i, -1)} disabled={i === 0}>
                    ↑
                  </IconButton>
                  <IconButton
                    title="move down"
                    onClick={() => moveProject(i, 1)}
                    disabled={i === projects.length - 1}
                  >
                    ↓
                  </IconButton>
                  <IconButton title="delete" onClick={() => removeProject(i)} danger>
                    ✕
                  </IconButton>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addProject}
              className="mt-2 border border-dashed border-neutral-300 px-2 py-2 text-xs text-neutral-500 hover:bg-neutral-50"
            >
              + add project
            </button>
          </div>

          <p className="px-4 pb-4 text-[10px] text-neutral-400 leading-relaxed">
            order here is the order on the homepage carousel. changes save to
            src/content/site.json — commit and push to publish.
          </p>
        </aside>

        <main className="flex-1 overflow-y-auto px-8 py-6">
          {selected ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-sm text-neutral-500">{selected.name}</h1>
                <a
                  href={`${import.meta.env.BASE_URL}project/${selected.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-neutral-400 hover:text-neutral-900"
                >
                  preview page ↗
                </a>
              </div>
              <ProjectEditor
                project={selected}
                slugTaken={(slug) =>
                  projects.some((p, i) => i !== selectedIndex && p.slug === slug)
                }
                onChange={(next) =>
                  setProjects(projects.map((p, i) => (i === selectedIndex ? next : p)))
                }
              />
            </>
          ) : (
            <div className="text-sm text-neutral-400">
              {projects.length ? 'select a project on the left' : 'no projects yet — add one to get started'}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
