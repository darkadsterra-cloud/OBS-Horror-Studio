import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const RECORDINGS_DIR = path.resolve(process.cwd(), "recordings");

if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RECORDINGS_DIR),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const ext = file.mimetype.includes("mp4") ? ".mp4" : ".webm";
    cb(null, `recording-${ts}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

const router = Router();

router.get("/recordings", (_req, res) => {
  try {
    const files = fs.existsSync(RECORDINGS_DIR)
      ? fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith(".webm") || f.endsWith(".mp4"))
      : [];
    const list = files.map(f => {
      const stat = fs.statSync(path.join(RECORDINGS_DIR, f));
      return {
        filename: f,
        size: stat.size,
        createdAt: stat.birthtime.toISOString(),
        url: `/api/recordings/download/${f}`,
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(list);
  } catch {
    res.status(500).json({ error: "Failed to list recordings" });
  }
});

router.post("/recordings/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  res.json({
    filename: req.file.filename,
    size: req.file.size,
    url: `/api/recordings/download/${req.file.filename}`,
  });
});

router.get("/recordings/download/:filename", (req, res) => {
  const { filename } = req.params;
  if (!filename || filename.includes("..")) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }
  const filePath = path.join(RECORDINGS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.download(filePath, filename);
});

router.delete("/recordings/:filename", (req, res) => {
  const { filename } = req.params;
  if (!filename || filename.includes("..")) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }
  const filePath = path.join(RECORDINGS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  fs.unlinkSync(filePath);
  res.json({ success: true });
});

export default router;
