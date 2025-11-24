// Mihin kortit piirretään (index.html:ssä div id="palveluRivi")
const PALVELU_CONTAINER_ID = 'palveluRivi';

// Luo yhden palvelukortin
function luoPalveluKortti(palvelu) {
  const kortti = document.createElement('div');
  kortti.className = 'palvelu-kortti';

  // Kuva
  const img = document.createElement('img');
  img.className = 'palvelu-kuva';
  img.src = palvelu.kuva;          // esim ../images/Juhlakuvaus.jpg
  img.alt = palvelu.nimi || '';
  kortti.appendChild(img);

  // Otsikko
  const otsikko = document.createElement('h3');
  otsikko.textContent = palvelu.nimi || '';
  kortti.appendChild(otsikko);

  // Hinta
  const hinta = document.createElement('p');
  hinta.className = 'hinta';
  hinta.textContent = `${palvelu.hinta} ${palvelu.yksikko || '€'}`;
  kortti.appendChild(hinta);

  // Kuvaus
  const kuvaus = document.createElement('p');
  kuvaus.textContent = palvelu.kuvaus || '';
  kortti.appendChild(kuvaus);

  return kortti;
}

// Jos tulee virhe, näytetään siisti teksti
function naytaVirhe(viesti) {
  const container = document.getElementById(PALVELU_CONTAINER_ID);
  if (!container) return;

  container.innerHTML = '';
  const p = document.createElement('p');
  p.style.color = 'red';
  p.textContent = 'Virhe palveluiden latauksessa: ' + viesti;
  container.appendChild(p);
}

// Lataa & piirrä palvelut
async function lataaJaNaytaPalvelut() {
  const container = document.getElementById(PALVELU_CONTAINER_ID);
  if (!container) return;

  container.innerHTML = 'Ladataan palveluita...';

  try {
    // tämä tulee data.js:stä (window.lataaPalvelut)
    const palvelut = await window.lataaPalvelut();

    container.innerHTML = '';

    palvelut.forEach(palvelu => {
      const kortti = luoPalveluKortti(palvelu);
      container.appendChild(kortti);
    });
  } catch (err) {
    console.error(err);
    naytaVirhe(err.message || 'Tuntematon virhe');
  }
}

// Käynnistä kun sivu valmis
document.addEventListener('DOMContentLoaded', lataaJaNaytaPalvelut);
