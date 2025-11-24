// Kaikki palvelut pidetään yhdessä arrayssa
let palvelutData = [];

// Luo yhden "rivin" admin-näkymään
function luoAdminRivi(palvelu) {
  const rivi = document.createElement('div');
  rivi.className = 'admin-palvelu';

  const img = document.createElement('img');
  img.className = 'admin-kuva';
  img.src = palvelu.kuva;
  img.alt = palvelu.nimi;

  const info = document.createElement('div');
  info.innerHTML = `
    <strong>${palvelu.nimi}</strong> – ${palvelu.hinta} ${palvelu.yksikko}<br>
    <small>${palvelu.kuvaus}</small>
  `;

  const btns = document.createElement('div');

  const editBtn = document.createElement('button');
  editBtn.textContent = 'Muokkaa';
  editBtn.dataset.id = palvelu.id;

  const delBtn = document.createElement('button');
  delBtn.textContent = 'Poista';
  delBtn.dataset.id = palvelu.id;
  delBtn.style.marginLeft = '10px';

  btns.appendChild(editBtn);
  btns.appendChild(delBtn);

  rivi.appendChild(img);
  rivi.appendChild(info);
  rivi.appendChild(btns);

  return rivi;
}

// Kuvalista adminille
const KUVA_LISTA = [
  "Juhlakuvaus.jpg",
  "Koira1.jpg",
  "Koira2.jpg",
  "KuvausStudio.jpg",
  "Tulostuspalvelu.jpg",
  "valokuvausKuva.jpg"
];


async function uploadKuva(file) {
  const formData = new FormData();
  formData.append('kuva', file); // sama nimi kuin serverissä upload.single('kuva')

  const resp = await fetch('photosite-production.up.railway.app/api/upload-image', {
    method: 'POST',
    body: formData,
  });

  if (!resp.ok) {
    throw new Error('Kuvan lähetys epäonnistui: ' + resp.status);
  }

  const data = await resp.json();
  return data.url; // esim: photosite-production.up.railway.app/images/KuvausStudio.jpg
}

// missä kansiossa kuvat on HTML-sivusta katsottuna
// (admin-panel-5500.html on /html-kansiossa -> kuvat ../images/)
const KUVA_KANSIO = "../images";

// Dropdown-kuvalista
const kuvanPolkuSelect = document.getElementById('kuva');
if (kuvanPolkuSelect) {
  KUVA_LISTA.forEach(nimi => {
    const opt = document.createElement('option');
    opt.value = `${KUVA_KANSIO}/${nimi}`;  // mitä talllennetaan jSONii` `
    opt.textContent = nimi;               // mitä käyttäjä näkee
    kuvanPolkuSelect.appendChild(opt);
  });
}

// Piirtää koko listan
function paivitaLista() {
  const lista = document.getElementById('lista');
  lista.innerHTML = '';
  palvelutData.forEach(p => {
    lista.appendChild(luoAdminRivi(p));
  });
}

// Luo uusi id
function luoUusiId() {
  const max = palvelutData.reduce((m, p) => {
    const n = parseInt(String(p.id).replace(/\D/g, ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return 'palvelu' + (max + 1);
}


async function kasitteleLomake(e) {
  e.preventDefault();

  const nimi = document.getElementById('nimi').value.trim();
  const hinta = document.getElementById('hinta').value.trim();
  const kuvaus = document.getElementById('kuvaus').value.trim();

  const kuvaSelect = document.getElementById('kuva');
  const kuvaTiedostoInput = document.getElementById('kuvaTiedosto');

  let kuvaPolku = kuvaSelect.value.trim();     // pudotusvalinta
  const tiedosto = kuvaTiedostoInput.files[0]; // file inputista

  try {
    // jos valittuna tiedosto, uploadataan se ensin
    if (tiedosto) {
      kuvaPolku = await uploadKuva(tiedosto);
    }

    if (!nimi || !hinta || !kuvaus || !kuvaPolku) {
      alert('Täytä kaikki kentät ja valitse kuva.');
      return;
    }

    const uusi = {
      id: luoUusiId(),
      nimi,
      hinta: Number(hinta),
      yksikko: '€',
      kuvaus,
      kuva: kuvaPolku
    };

    palvelutData.push(uusi);
    const token = localStorage.getItem('adminToken');
    await tallennaPalvelut(palvelutData, token);
    paivitaLista();

    e.target.reset();           // tyhjennä form
    kuvaSelect.value = '';      // reset dropdown
  } catch (err) {
    console.error(err);
    alert('Virhe kuvan käsittelyssä.');
  }
}


// Muokkaus / poisto klikkauksesta (event delegation)
async function kasitteleListaKlikki(e) {
  if (!e.target.matches('button')) return;

  const id = e.target.dataset.id;
  const palvelu = palvelutData.find(p => p.id === id);
  if (!palvelu) return;

  if (e.target.textContent === 'Poista') {
    if (confirm(`Poistetaanko "${palvelu.nimi}"?`)) {

      palvelutData = palvelutData.filter(p => p.id !== id);

      const token =
       localStorage.getItem('adminToken');
        await tallennaPalvelut(palvelutData,token);
      paivitaLista();
    }
  } else if (e.target.textContent === 'Muokkaa') {
    const uusiNimi = prompt('Uusi nimi:', palvelu.nimi);
    if (uusiNimi === null) return;

    const uusiHinta = prompt('Uusi hinta (numero):', palvelu.hinta);
    if (uusiHinta === null) return;

    const uusiKuvaus = prompt('Uusi kuvaus:', palvelu.kuvaus);
    if (uusiKuvaus === null) return;

    palvelu.nimi = uusiNimi.trim() || palvelu.nimi;
    palvelu.hinta = Number(uusiHinta) || palvelu.hinta;
    palvelu.kuvaus = uusiKuvaus.trim() || palvelu.kuvaus;

    tallennaPalvelut(palvelutData);
    paivitaLista();
  }
}

// =====================
// TEEMAN VAIHTO (dark/light)
// =====================

function paivitaTeemaNappi() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  if (document.body.classList.contains('admin-dark')) {
    btn.textContent = 'Light-tila';
  } else {
    btn.textContent = 'Dark-tila';
  }
}

function asetaTeema(teema) {
  document.body.classList.remove('admin-dark', 'admin-light');
  document.body.classList.add(teema);
  localStorage.setItem('adminTheme', teema);
  paivitaTeemaNappi();
}

function alustaTeema() {
  const tallennettu = localStorage.getItem('adminTheme') || 'admin-dark';
  asetaTeema(tallennettu);

  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const uusi = document.body.classList.contains('admin-dark')
        ? 'admin-light'
        : 'admin-dark';
      asetaTeema(uusi);
    });
  }
}


// Init
document.addEventListener('DOMContentLoaded', async () => {
  
  // turvacheck
  const token = localStorage.getItem('adminToken');
  if (!token) {
    // ei kirjautumista → takaisin login-sivulle
    window.location.href = 'admin-login.html';
    return;
  }


  // teema
  alustaTeema();
  
  //data
  palvelutData = await lataaPalvelut(); // data.js
  paivitaLista();

  const lomake = document.getElementById('lisaa-form');
  lomake.addEventListener('submit', kasitteleLomake);

  const lista = document.getElementById('lista');
  lista.addEventListener('click', kasitteleListaKlikki);
});
