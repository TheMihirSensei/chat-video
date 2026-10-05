import type {Lesson} from './model';

export type LessonSummary = {name: string; slides: number; updated: number};
export type MediaKind = 'gif' | 'audio';
export type RenderJob = {
  id: string;
  name: string;
  status: 'bundling' | 'rendering' | 'done' | 'error';
  progress: number;
  error: string | null;
  duration?: number;
};

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body as T;
};

export const api = {
  listLessons: () => request<LessonSummary[]>('/api/lessons'),
  getLesson: (name: string) => request<unknown>(`/api/lessons/${encodeURIComponent(name)}`),
  saveLesson: (name: string, lesson: Lesson) =>
    request<{ok: true}>(`/api/lessons/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(lesson),
    }),
  listFiles: (kind: MediaKind) => request<string[]>(`/api/files?kind=${kind}`),
  upload: (kind: MediaKind, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{path: string}>(`/api/upload?kind=${kind}`, {method: 'POST', body: form});
  },
  startRender: (name: string) => request<RenderJob>(`/api/render/${encodeURIComponent(name)}`, {method: 'POST'}),
  getRender: (id: string) => request<RenderJob>(`/api/render/${id}`),
  /** Audio lengths in seconds (null = unreadable), measured by the server with ffprobe. */
  audioDurations: (paths: string[]) =>
    request<Record<string, number | null>>('/api/durations', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({paths}),
    }),
  videoStatus: (name: string) => request<{exists: boolean; updated?: number}>(`/api/videos-status/${encodeURIComponent(name)}`),
};

/** URL of a file inside public/ (lesson files store paths relative to public/). */
export const publicUrl = (path: string) => '/' + path.replace(/^\/+/, '');
