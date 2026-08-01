import type { Block, Project } from '../content';
import { Field, IconButton, ImageInput, LinesInput, TextArea, TextInput } from './fields';
import { slugify } from './api';

const newBlock = (type: Block['type']): Block => {
  switch (type) {
    case 'text':
      return { type: 'text', heading: '', paragraphs: [] };
    case 'full':
      return { type: 'full', image: '' };
    case 'grid':
      return { type: 'grid', images: ['', ''] };
  }
};

const BLOCK_LABELS: Record<Block['type'], string> = {
  text: 'text section',
  full: 'full-width image',
  grid: 'image grid',
};

function BlockCard({
  block,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  block: Block;
  index: number;
  total: number;
  onChange: (block: Block) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-neutral-200 p-4 flex flex-col gap-3 bg-white">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-neutral-500">
          {index + 1}. {BLOCK_LABELS[block.type]}
        </span>
        <div className="flex gap-1">
          <IconButton title="move up" onClick={() => onMove(-1)} disabled={index === 0}>
            ↑
          </IconButton>
          <IconButton title="move down" onClick={() => onMove(1)} disabled={index === total - 1}>
            ↓
          </IconButton>
          <IconButton title="delete block" onClick={onRemove} danger>
            ✕
          </IconButton>
        </div>
      </div>

      {block.type === 'text' && (
        <>
          <Field label="heading">
            <TextInput value={block.heading} onChange={(heading) => onChange({ ...block, heading })} />
          </Field>
          <Field label="paragraphs" hint="separate paragraphs with a blank line">
            <LinesInput
              value={block.paragraphs}
              rows={8}
              onChange={(paragraphs) => onChange({ ...block, paragraphs })}
            />
          </Field>
        </>
      )}

      {block.type === 'full' && (
        <ImageInput
          value={block.image}
          aspect="aspect-[16/9]"
          onChange={(image) => onChange({ ...block, image })}
        />
      )}

      {block.type === 'grid' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            {block.images.map((image, i) => (
              <ImageInput
                key={i}
                value={image}
                onChange={(next) => {
                  const images = [...block.images];
                  images[i] = next;
                  onChange({ ...block, images });
                }}
                onRemove={() => onChange({ ...block, images: block.images.filter((_, j) => j !== i) })}
              />
            ))}
          </div>
          <div>
            <IconButton onClick={() => onChange({ ...block, images: [...block.images, ''] })}>
              + add image to grid
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectEditor({
  project,
  onChange,
  slugTaken,
}: {
  project: Project;
  onChange: (project: Project) => void;
  slugTaken: (slug: string) => boolean;
}) {
  const caseStudy = project.caseStudy;
  const patchCase = (patch: Partial<Project['caseStudy']>) =>
    onChange({ ...project, caseStudy: { ...caseStudy, ...patch } });

  const setBlocks = (blocks: Block[]) => patchCase({ blocks });

  const slugClash = slugTaken(project.slug);
  const slugInvalid = !project.slug || !/^[a-z0-9-]+$/.test(project.slug);

  return (
    <div className="flex flex-col gap-8 pb-24">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm uppercase tracking-wide text-neutral-900">carousel card</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            <Field label="name">
              <TextInput
                value={project.name}
                onChange={(name) => {
                  // Keep the slug in step with the name until it's been edited
                  // by hand, so URLs don't silently drift from the title.
                  const wasAuto = project.slug === slugify(project.name);
                  onChange({ ...project, name, slug: wasAuto ? slugify(name) : project.slug });
                }}
              />
            </Field>
            <Field label="details" hint="the grey caption beside the title">
              <TextInput value={project.details} onChange={(details) => onChange({ ...project, details })} />
            </Field>
            <Field label="slug" hint={`page url: /project/${project.slug || '…'}`}>
              <TextInput value={project.slug} onChange={(slug) => onChange({ ...project, slug })} />
            </Field>
            {slugInvalid && (
              <p className="text-xs text-red-600">
                slug must be lowercase letters, numbers and dashes
              </p>
            )}
            {!slugInvalid && slugClash && (
              <p className="text-xs text-red-600">another project already uses this slug</p>
            )}
          </div>
          <Field label="thumbnail" hint="shown in the homepage carousel">
            <ImageInput value={project.image} onChange={(image) => onChange({ ...project, image })} />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm uppercase tracking-wide text-neutral-900">case study header</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            <Field label="intro">
              <TextArea value={caseStudy.intro} onChange={(intro) => patchCase({ intro })} />
            </Field>
            <Field label="label" hint="small grey text under the intro">
              <TextInput value={caseStudy.label} onChange={(label) => patchCase({ label })} />
            </Field>
          </div>
          <Field label="hero image">
            <ImageInput
              value={caseStudy.hero}
              aspect="aspect-[16/9]"
              onChange={(hero) => patchCase({ hero })}
            />
          </Field>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Field label="company">
            <TextInput
              value={caseStudy.meta.company}
              onChange={(company) => patchCase({ meta: { ...caseStudy.meta, company } })}
            />
          </Field>
          <Field label="services" hint="one per line">
            <LinesInput
              value={caseStudy.meta.services}
              rows={4}
              onChange={(services) => patchCase({ meta: { ...caseStudy.meta, services } })}
            />
          </Field>
          <Field label="industry">
            <TextInput
              value={caseStudy.meta.industry}
              onChange={(industry) => patchCase({ meta: { ...caseStudy.meta, industry } })}
            />
          </Field>
          <Field label="year">
            <TextInput
              value={caseStudy.meta.year}
              onChange={(year) => patchCase({ meta: { ...caseStudy.meta, year } })}
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-wide text-neutral-900">case study body</h2>
          <div className="flex gap-1">
            <IconButton onClick={() => setBlocks([...caseStudy.blocks, newBlock('text')])}>
              + text
            </IconButton>
            <IconButton onClick={() => setBlocks([...caseStudy.blocks, newBlock('full')])}>
              + full image
            </IconButton>
            <IconButton onClick={() => setBlocks([...caseStudy.blocks, newBlock('grid')])}>
              + grid
            </IconButton>
          </div>
        </div>

        {caseStudy.blocks.length === 0 && (
          <p className="text-xs text-neutral-400">
            no blocks yet — the page will show just the header and hero image
          </p>
        )}

        <div className="flex flex-col gap-4">
          {caseStudy.blocks.map((block, i) => (
            <BlockCard
              key={i}
              block={block}
              index={i}
              total={caseStudy.blocks.length}
              onChange={(next) => setBlocks(caseStudy.blocks.map((b, j) => (j === i ? next : b)))}
              onMove={(delta) => {
                const target = i + delta;
                if (target < 0 || target >= caseStudy.blocks.length) return;
                const blocks = [...caseStudy.blocks];
                [blocks[i], blocks[target]] = [blocks[target], blocks[i]];
                setBlocks(blocks);
              }}
              onRemove={() => setBlocks(caseStudy.blocks.filter((_, j) => j !== i))}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
