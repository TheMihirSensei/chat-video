// Lesson Studio: a local web editor for lesson videos.
//
//   npm run editor        → http://localhost:3210
//
// Serves the editor page (via Vite), the files in public/, and a small API to list/save
// lessons in lessons/, upload GIFs and audio into public/uploads/, and render MP4s
// into out/lessons/.
import {execFile} from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import express from 'express';
import multer from 'multer';
import {createServer as createViteServer} from 'vite';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const editorDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(editorDir, '..');
const LESSONS_DIR = path.join(root, 'lessons');
const PUBLIC_DIR = path.join(root, 'public');
const OUT_DIR = path.join(root, 'out', 'lessons');
const PORT = Number(process.env.PORT ?? 3210);

const MEDIA_KINDS = {
  gif: {folder: 'uploads/gifs', extensions: ['.gif', '.png', '.webp', '.svg', '.webm', '.jpg', '.jpeg']},
  audio: {folder: 'uploads/audio', extensions: ['.mp3', '.wav', '.m4a', '.ogg', '.aac']},
};
// Existing folders whose files can be picked again in the editor.
const BROWSE_FOLDERS = {gif: ['characters', 'gifs', 'uploads/gifs'], audio: ['audio', 'uploads/audio']};

const isValidName = (name) => /^[a-z0-9][a-z0-9_-]{0,60}$/i.test(name);
const lessonPath = (name) => path.join(LESSONS_DIR, `${name}.json`);
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'file';

const app = express();
app.use(express.json({limit: '5mb'}));

// ---------- Lessons
app.get('/api/lessons', (_req, res) => {
  fs.mkdirSync(LESSONS_DIR, {recursive: true});
  const lessons = fs
    .readdirSync(LESSONS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((file) => {
      const full = path.join(LESSONS_DIR, file);
      let slides = 0;
      try {
        const json = JSON.parse(fs.readFileSync(full, 'utf8'));
        slides = json.slides?.length ?? Math.ceil((json.lines?.length ?? 0) / 2);
      } catch {
        // Broken JSON still shows up in the list; opening it reports the error.
      }
      return {name: path.basename(file, '.json'), slides, updated: fs.statSync(full).mtimeMs};
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
  res.json(lessons);
});

app.get('/api/lessons/:name', (req, res) => {
  const {name} = req.params;
  if (!isValidName(name) || !fs.existsSync(lessonPath(name))) return res.status(404).json({error: 'Lesson not found'});
  try {
    res.json(JSON.parse(fs.readFileSync(lessonPath(name), 'utf8')));
  } catch (err) {
    res.status(500).json({error: `lessons/${name}.json is not valid JSON: ${err.message}`});
  }
});

app.put('/api/lessons/:name', (req, res) => {
  const {name} = req.params;
  if (!isValidName(name)) return res.status(400).json({error: 'Use letters, numbers, - and _ only'});
  const lesson = req.body;
  if (!lesson || !Array.isArray(lesson.slides)) return res.status(400).json({error: 'A lesson needs a "slides" list'});
  // Never save the computed audio lengths; they're recalculated on every render.
  delete lesson.audioDurations;
  delete lesson.translationAudioDurations;
  fs.mkdirSync(LESSONS_DIR, {recursive: true});
  fs.writeFileSync(lessonPath(name), JSON.stringify(lesson, null, 2) + '\n');
  res.json({ok: true});
});

// ---------- Media files
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const dir = path.join(PUBLIC_DIR, MEDIA_KINDS[req.query.kind].folder);
      fs.mkdirSync(dir, {recursive: true});
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = slug(path.basename(file.originalname, ext));
      cb(null, `${base}-${crypto.randomBytes(3).toString('hex')}${ext}`);
    },
  }),
  limits: {fileSize: 100 * 1024 * 1024},
  fileFilter: (req, file, cb) => {
    const kind = MEDIA_KINDS[req.query.kind];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!kind) return cb(new Error('Unknown upload kind'));
    if (!kind.extensions.includes(ext)) return cb(new Error(`Allowed file types: ${kind.extensions.join(', ')}`));
    cb(null, true);
  },
});

app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({error: err.message});
    if (!req.file) return res.status(400).json({error: 'No file received'});
    // Paths in lesson files are relative to public/.
    res.json({path: path.relative(PUBLIC_DIR, req.file.path).split(path.sep).join('/')});
  });
});

app.get('/api/files', (req, res) => {
  const kind = req.query.kind;
  if (!MEDIA_KINDS[kind]) return res.status(400).json({error: 'Unknown kind'});
  const files = [];
  for (const folder of BROWSE_FOLDERS[kind]) {
    const dir = path.join(PUBLIC_DIR, folder);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (MEDIA_KINDS[kind].extensions.includes(path.extname(file).toLowerCase())) files.push(`${folder}/${file}`);
    }
  }
  res.json(files.sort());
});

// ---------- Audio lengths for the live preview (same ffprobe Remotion ships with)
const compositorDir = (() => {
  const scope = path.join(root, 'node_modules', '@remotion');
  const name = fs.readdirSync(scope).find((d) => d.startsWith('compositor-'));
  return name ? path.join(scope, name) : null;
})();
const ffprobeBin = compositorDir && path.join(compositorDir, process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
const durationCache = new Map();

const probeDuration = (file) =>
  new Promise((resolve) => {
    if (!ffprobeBin || !fs.existsSync(ffprobeBin)) return resolve(null);
    const args = ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file];
    // The bundled ffprobe loads its libraries from its own folder.
    const env = {...process.env, LD_LIBRARY_PATH: compositorDir, DYLD_LIBRARY_PATH: compositorDir};
    execFile(ffprobeBin, args, {env, timeout: 15000}, (err, stdout) => {
      const seconds = Number(String(stdout).trim().split(/\s+/).pop());
      resolve(err || !Number.isFinite(seconds) ? null : seconds);
    });
  });

app.post('/api/durations', async (req, res) => {
  const paths = Array.isArray(req.body?.paths) ? req.body.paths.slice(0, 500) : [];
  const result = {};
  await Promise.all(
    paths.map(async (p) => {
      const file = path.resolve(PUBLIC_DIR, String(p));
      if (!file.startsWith(PUBLIC_DIR + path.sep) || !fs.existsSync(file)) return (result[p] = null);
      const key = `${file}:${fs.statSync(file).mtimeMs}`;
      if (!durationCache.has(key)) durationCache.set(key, probeDuration(file));
      result[p] = await durationCache.get(key);
    }),
  );
  res.json(result);
});

// ---------- Rendering (one at a time)
const jobs = new Map();
let activeJob = null;

app.post('/api/render/:name', async (req, res) => {
  const {name} = req.params;
  if (!isValidName(name) || !fs.existsSync(lessonPath(name))) return res.status(404).json({error: 'Save the lesson first'});
  if (activeJob) return res.status(409).json({error: `Already rendering "${activeJob.name}". Wait for it to finish.`});

  const job = {id: crypto.randomUUID(), name, status: 'bundling', progress: 0, error: null, startedAt: Date.now()};
  jobs.set(job.id, job);
  activeJob = job;
  res.json(job);

  try {
    const lesson = JSON.parse(fs.readFileSync(lessonPath(name), 'utf8'));
    // Bundle per render so newly uploaded files in public/ are included.
    const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), rootDir: root});
    job.status = 'rendering';
    const composition = await selectComposition({serveUrl, id: 'LessonVideo', inputProps: lesson});
    fs.mkdirSync(OUT_DIR, {recursive: true});
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      imageFormat: 'jpeg',
      outputLocation: path.join(OUT_DIR, `${name}.mp4`),
      inputProps: lesson,
      onProgress: ({progress}) => {
        job.progress = progress;
      },
    });
    job.status = 'done';
    job.progress = 1;
    job.duration = composition.durationInFrames / composition.fps;
  } catch (err) {
    job.status = 'error';
    job.error = err.message;
    console.error(`Render of ${name} failed:`, err);
  } finally {
    job.finishedAt = Date.now();
    activeJob = null;
  }
});

app.get('/api/render/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({error: 'Unknown render job'});
  res.json(job);
});

app.get('/api/videos/:name', (req, res) => {
  const name = req.params.name.replace(/\.mp4$/, '');
  const file = path.join(OUT_DIR, `${name}.mp4`);
  if (!isValidName(name) || !fs.existsSync(file)) return res.status(404).json({error: 'Not rendered yet'});
  if (req.query.download) res.attachment(`${name}.mp4`);
  res.sendFile(file);
});

app.get('/api/videos-status/:name', (req, res) => {
  const file = path.join(OUT_DIR, `${req.params.name}.mp4`);
  if (!isValidName(req.params.name) || !fs.existsSync(file)) return res.json({exists: false});
  res.json({exists: true, updated: fs.statSync(file).mtimeMs});
});

// ---------- Static files + editor page
app.use(express.static(PUBLIC_DIR));
const vite = await createViteServer({
  configFile: path.join(editorDir, 'vite.config.mjs'),
  server: {middlewareMode: true},
  appType: 'spa',
});
app.use(vite.middlewares);

app.listen(PORT, () => {
  console.log(`\n  Lesson Studio is running:  http://localhost:${PORT}\n`);
});
