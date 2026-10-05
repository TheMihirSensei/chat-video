import React, {useEffect, useRef, useState} from 'react';
import {api, publicUrl, type MediaKind} from '../api';

// Files already in public/ (shared across every picker, refreshed after uploads).
const fileLists: Partial<Record<MediaKind, Promise<string[]>>> = {};
const listeners = new Set<() => void>();
const loadFiles = (kind: MediaKind, refresh = false) => {
  if (refresh || !fileLists[kind]) fileLists[kind] = api.listFiles(kind).catch(() => []);
  return fileLists[kind]!;
};

const useFileList = (kind: MediaKind) => {
  const [files, setFiles] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    const update = () => loadFiles(kind).then((list) => alive && setFiles(list));
    update();
    listeners.add(update);
    return () => {
      alive = false;
      listeners.delete(update);
    };
  }, [kind]);
  return files;
};

const ACCEPT: Record<MediaKind, string> = {
  gif: '.gif,.png,.webp,.svg,.webm,.jpg,.jpeg',
  audio: '.mp3,.wav,.m4a,.ogg,.aac',
};

const fileName = (path: string) => path.split('/').pop() ?? path;

/** Upload a new file or pick one that's already in public/. Stores the path relative to public/. */
export const FileField: React.FC<{
  kind: MediaKind;
  value: string | undefined;
  onChange: (path: string | undefined) => void;
  label: string;
}> = ({kind, value, onChange, label}) => {
  const input = useRef<HTMLInputElement>(null);
  const files = useFileList(kind);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const {path} = await api.upload(kind, file);
      await loadFiles(kind, true);
      listeners.forEach((l) => l());
      onChange(path);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className={`file-field file-field--${kind}`}>
      <div className="file-field__row">
        {kind === 'audio' ? (
          value ? (
            <audio key={value} className="file-field__audio" controls preload="metadata" src={publicUrl(value)} />
          ) : (
            <span className="file-field__empty">No {label.toLowerCase()} yet</span>
          )
        ) : null}
        <div className="file-field__actions">
          <button type="button" className="btn btn--small" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}
          </button>
          <select
            className="file-field__select"
            value=""
            onChange={(e) => e.target.value && onChange(e.target.value)}
            title={`Use a ${kind === 'gif' ? 'picture' : 'clip'} that's already uploaded`}
          >
            <option value="">Choose existing…</option>
            {files.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          {value && (
            <button type="button" className="btn btn--small btn--ghost" onClick={() => onChange(undefined)} title="Remove">
              ✕
            </button>
          )}
        </div>
      </div>
      {value && <div className="file-field__name" title={value}>{fileName(value)}</div>}
      {error && <div className="field-error">{error}</div>}
      <input ref={input} type="file" accept={ACCEPT[kind]} hidden onChange={(e) => onPick(e.target.files?.[0])} />
    </div>
  );
};

/** Square thumbnail picker for a line's GIF. */
export const GifField: React.FC<{value: string | undefined; onChange: (path: string | undefined) => void}> = ({
  value,
  onChange,
}) => (
  <div className="gif-field">
    <div className={`gif-field__preview ${value ? '' : 'gif-field__preview--empty'}`}>
      {value ? (
        value.endsWith('.webm') ? (
          <video src={publicUrl(value)} autoPlay loop muted playsInline />
        ) : (
          <img src={publicUrl(value)} alt="" />
        )
      ) : (
        <span>No GIF</span>
      )}
    </div>
    <FileField kind="gif" value={value} onChange={onChange} label="GIF" />
  </div>
);
