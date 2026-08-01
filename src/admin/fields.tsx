import { useRef, useState } from 'react';
import { previewSrc, uploadImage } from './api';

const inputClass =
  'w-full border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 bg-white';

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wide text-neutral-500">{label}</span>
      {children}
      {hint && <span className="text-xs text-neutral-400">{hint}</span>}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      className={inputClass}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      className={`${inputClass} leading-relaxed resize-y`}
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** Newline-separated editing for string arrays (services, paragraphs). */
export function LinesInput({
  value,
  onChange,
  rows = 6,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  rows?: number;
  placeholder?: string;
}) {
  // Kept as raw text while focused so blank lines mid-typing don't vanish.
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? value.join('\n\n');

  return (
    <textarea
      className={`${inputClass} leading-relaxed resize-y`}
      rows={rows}
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        setDraft(e.target.value);
        onChange(
          e.target.value
            .split(/\n{2,}/)
            .map((line) => line.trim())
            .filter(Boolean),
        );
      }}
      onBlur={() => setDraft(null)}
    />
  );
}

export function ImageInput({
  value,
  onChange,
  onRemove,
  aspect = 'aspect-[4/3]',
}: {
  value: string;
  onChange: (path: string) => void;
  onRemove?: () => void;
  aspect?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const result = await uploadImage(file);
      onChange(result.path);
      const from = Math.round(result.originalBytes / 1024);
      const to = Math.round(result.bytes / 1024);
      setNote(`optimised ${from}KB → ${to}KB webp`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`${aspect} w-full bg-neutral-100 border border-neutral-200 overflow-hidden relative`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
      >
        {value ? (
          <img src={previewSrc(value)} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
            drop an image here
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-xs text-neutral-500">
            optimising…
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
          onClick={() => fileRef.current?.click()}
        >
          upload
        </button>
        {onRemove && (
          <button
            type="button"
            className="border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 text-red-600"
            onClick={onRemove}
          >
            remove
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
      </div>

      <input
        className={`${inputClass} text-xs`}
        value={value}
        placeholder="/images/… or https://…"
        onChange={(e) => onChange(e.target.value)}
      />
      {note && <span className="text-xs text-green-700">{note}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export function IconButton({
  children,
  onClick,
  disabled,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`border border-neutral-300 px-2 py-1 text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-100 ${
        danger ? 'text-red-600' : 'text-neutral-700'
      }`}
    >
      {children}
    </button>
  );
}
