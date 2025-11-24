const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 4000;

// ---------------------
// Vakiot
// ---------------------
const DATA_PATH = path.join(__dirname, 'data', 'palvelut.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');   // kuvat public/images
const ADMIN_PASSWORD = '1234';                        // vaihda kun haluat

// Luo images-kansion jos puuttuu
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// ---------------------
// Multer: kuvien tallennus
// ---------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// ---------------------
// Middlewaret
// ---------------------
app.use(express.json());
app.use(cors());

// Palvele frontti + staattiset tiedostot
app.use(express.static(PUBLIC_DIR));
// (tää on itse asiassa jo enough, mutta ei haittaa vaikka on erikseen vielä:)
app.use('/images', express.static(IMAGES_DIR));

// ---------------------
// Rate limit kirjautumiselle
// ---------------------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,                   // 5 yritystä
  handler: (req, res) => {
    const now = Date.now();
    const resetTime = now + 15 * 60 * 1000; // koska esto loppuu

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

  // oikeassa projektissa tekisit JWT:n tms.
  const token = 'dummy-admin-token';
  res.json({ token });
});

// Kuvan upload
app.post('photosite-production.up.railway.app/api/upload-image', upload.single('kuva'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Tiedosto puuttuu' });
  }

  // HUOM: ei hardkoodattua localhostia -> relativen polku riittää
  const publicUrl = `/images/${req.file.filename}`;
  res.json({ url: publicUrl });
});

// Hae kaikki palvelut
app.get('photosite-production.up.railway.app/api/palvelut', (req, res) => {
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) {
      console.error('Lukuvirhe:', err);
      return res.status(500).json({ error: 'Virhe palveluiden luvussa' });
    }

    try {
      const json = JSON.parse(data || '[]');
      res.json(json);
    } catch (parseErr) {
      console.error('JSON-virhe:', parseErr);
      res.status(500).json({ error: 'Virhe datan muodossa' });
    }
  });
});

// Tallenna KOKO lista
app.put('photosite-production.up.railway.app/api/palvelut', (req, res) => {
  const palvelut = req.body;

  if (!Array.isArray(palvelut)) {
    return res.status(400).json({ error: 'Odotettiin arrayta' });
  }

  fs.writeFile(
    DATA_PATH,
    JSON.stringify(palvelut, null, 2),
    'utf8',
    (err) => {
      if (err) {
        console.error('Kirjoitusvirhe:', err);
        return res.status(500).json({ error: 'Virhe tallennuksessa' });
      }
      res.json({ ok: true });
    }
  );
});

// ---------------------
// Käynnistä serveri
// ---------------------
app.listen(PORT, () => {
  console.log(`Backend käynnissä http://localhost:${PORT}`);
});
