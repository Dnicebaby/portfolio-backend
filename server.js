// ============================================================
// Divin Gangbo Portfolio — Sync Backend
// Stores the portfolio's localStorage blob so photos/settings
// sync across devices. Persists to disk so Render restarts
// don't wipe the data.
// ============================================================

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Persistence ─────────────────────────────────────────────
// Render's free disk is ephemeral, but a file on disk still
// survives normal request cycles and most restarts far better
// than in-memory. If a persistent disk is mounted, set
// DATA_DIR to its path via an env var.
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DATA_FILE = path.join(DATA_DIR, 'portfolio-data.json');

let store = {};

function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) || {};
      console.log('Loaded portfolio data (' + Object.keys(store).length + ' keys).');
    } else {
      console.log('No data file yet — starting empty.');
    }
  } catch (err) {
    console.error('Failed to load data file:', err.message);
    store = {};
  }
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store), 'utf8');
  } catch (err) {
    console.error('Failed to save data file:', err.message);
  }
}

loadStore();

// ── CORS ────────────────────────────────────────────────────
// Allow the GitHub Pages site (and local dev) to call the API.
const allowedOrigins = [
  'https://dnicebaby.github.io',
  'http://localhost:3000',
  'http://localhost:5000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser tools (curl, health checks) with no origin.
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(null, true); // permissive: this is a public read/write blob anyway
  }
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// ── Health check ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'Portfolio backend is running!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', keys: Object.keys(store).length });
});

// ── Sync endpoints (what the front-end actually calls) ──────
// GET /api/portfolio/data  → returns the whole stored blob
app.get('/api/portfolio/data', (req, res) => {
  try {
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/portfolio/data  → replaces stored keys with posted blob
// Body is an object of { pf_photos: "...", pf_profile: "...", ... }
app.put('/api/portfolio/data', (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
      return res.status(400).json({ error: 'Body must be a JSON object of key/value pairs.' });
    }
    // Merge so a partial push never wipes existing keys.
    Object.keys(incoming).forEach(function (k) {
      store[k] = incoming[k];
    });
    saveStore();
    res.json({ success: true, keys: Object.keys(store).length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optional: full reset (not called by the site, handy for debugging)
app.delete('/api/portfolio/data', (req, res) => {
  store = {};
  saveStore();
  res.json({ success: true });
});

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, function () {
  console.log('Portfolio backend listening on port ' + PORT);
});
