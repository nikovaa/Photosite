// Kaikki frontti & admin käyttää samaa URLia
const PALVELU_API_URL = '/api/palvelut';

// Hae palvelut backendiltä
async function lataaPalvelut() {
  try {
    const resp = await fetch(PALVELU_API_URL);
    if (!resp.ok) {
      throw new Error('HTTP-virhe: ' + resp.status);
    }
    return await resp.json();
  } catch (err) {
    console.error('Virhe palveluiden haussa:', err);
    return []; // tyhjä lista jos kaatuu
  }
}

// Tallenna KOKO lista backendille (PUT /api/palvelut)
async function tallennaPalvelut(palvelut, token) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const token = localStorage.getItem('adminToken');

  const resp = await fetch(PALVELU_API_URL, {
    method: 'PUT',
    headers: {
    'Content-Type': 'application/json',
    'X-Admin-Token': token
    },
    body: JSON.stringify(palvelut),
  });

    if (!resp.ok) {
      throw new Error('HTTP-virhe tallennuksessa: ' + resp.status);
    }

    console.log('Tallennettu backendille OK');
  } catch (err) {
    console.error('Virhe tallennuksessa:', err);
    alert('Tallennus epäonnistui (backend)');
  }
}

// Viedään funkkarit adminille & app.js:lle
window.lataaPalvelut = lataaPalvelut;
window.tallennaPalvelut = tallennaPalvelut;
