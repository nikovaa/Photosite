const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { getPalvelut, savePalvelut } = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

// Vakiot
const DATA_PATH = path.join(__dirname, 'data', 'palvelut.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');   // kuvat public/images
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1234';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'superadmin-token-123';

// Luo images-kansion jos puuttuu
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// ---------------------
// Multer: kuvien tallennus
// ---------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // max 5 MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Vain kuvat sallittu'));
    }
    cb(null, true);
  }
});

// ---------------------
// Middlewaret
// ---------------------
app.use(express.json());

const allowedOrigins = [
  'http://localhost:5500',
  'https://photosite-production.up.railway.app'
];

app.use(cors({
  origin: allowedOrigins
}));

// Palvele frontti + staattiset tiedostot
app.use(express.static(PUBLIC_DIR));
app.use('/images', express.static(IMAGES_DIR));

// ---------------------
// Rate limit kirjautumiselle
// ---------------------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,                   // 5 yritystä
  handler: (req, res) => {
    const now = Date.now();
    const resetTime = now + 15 * 60 * 1000;

    res.status(429).json({
      error: 'Liian monta kirjautumisyritystä.',
      reset: resetTime,
    });
  },
});

// ---------------------
// Reitit
// -------------------

// Pääjuuri -> index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// LOGIN
app.post('/api/login', loginLimiter, (req, res) => {
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Väärä salasana' });
  }

  const token = ADMIN_TOKEN;
  res.json({ token });
});

// Middleware tokenille
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];

  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Ei oikeutta (admin-token puuttuu)' });
  }

  next();
}

// Kuvan upload
app.post('/api/upload-image', requireAdmin, upload.single('kuva'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Tiedosto puuttuu' });
  }

  const publicPath = `/images/${req.file.filename}`;
  res.json({ url: publicPath });
});

// Hae kaikki palvelut
app.get('/api/palvelut', async (req, res) => {
  try {
    const palvelut = await getPalvelut();   // db.js
    res.json(palvelut);
  } catch (err) {
    console.error('DB-virhe haussa:', err);
    res.status(500).json({ error: 'Virhe palveluiden luvussa' });
  }
});

// Tallenna KOKO lista
app.put('/api/palvelut', requireAdmin, async (req, res) => {
  const palvelut = req.body;

  if (!Array.isArray(palvelut)) {
    return res.status(400).json({ error: 'Odotettiin arrayta' });
  }

  try {
    await savePalvelut(palvelut);  // db.js
    res.json({ ok: true });
  } catch (err) {
    console.error('DB-virhe tallennuksessa:', err);
    res.status(500).json({ error: 'Virhe tallennuksessa'  });
  }
});

// Multer / upload -virheet
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Vain kuvat sallittu') {
    return res.status(400).json({ error: err.message });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Serverivirhe' });
});

// ---------------------
// Käynnistä serveri
// ---------------------
app.listen(PORT, () => {
  console.log(`Backend käynnissä http://localhost:${PORT}`);
});
