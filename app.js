let registros = [];
let especies = [];
let marcadores = [];

const LAT_INICIAL = 24.4;   // Ajusta si deseas, centro BCS
const LON_INICIAL = -110.3;
const ZOOM = 7;

const map = L.map('map').setView([LAT_INICIAL, LON_INICIAL], ZOOM);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

Papa.parse('data/especies.csv', {
  header: true,
  download: true,
  complete: function(results) {
    // TRUCO: muestra cómo ve PapaParse tus registros (borra luego)
    console.log('Ejemplo de registro:', results.data[0]);

    // Solo registros con coordenadas no vacías
    registros = results.data.filter(r =>
      r['Latitud_Grados decimales'] && r['Longitud_Grados decimales']
    );

    especies = [...new Set(registros.map(r => r['Especie']).filter(e => e))];
    inicializarFiltros(registros, especies);
    dibujarPuntos(registros, especies);
    renderLegenda(especies);
  }
});

function inicializarFiltros(data, especiesLista) {
  // ESPECIE
  const especieForm = document.getElementById("especie-list-form");
  especieForm.innerHTML = especiesLista.map(especie =>
    `<div class="multiselect-item"><input type="checkbox" value="${especie}" checked> <span>${especie}</span></div>`
  ).join('');

  // SEXO y MADUREZ: usa los nombres exactos, respeta espacios y tildes
  const sexoSel = document.getElementById('sexo');
  const madurezSel = document.getElementById('madurez');
  const sexos = [...new Set(data.map(r => r['Sexo  ']).filter(x => x))];
  const madureces = [...new Set(data.map(r => r['Estadío (Adulto (A) Juvenil (J) Neonato (N) Preñada (P), No definido (ND)']).filter(x => x))];

  sexoSel.innerHTML = `<option value="">Todos</option>${sexos.map(s => `<option>${s}</option>`).join('')}`;
  madurezSel.innerHTML = `<option value="">Todos</option>${madureces.map(m => `<option>${m}</option>`).join('')}`;
}

function dibujarPuntos(data, especiesLista) {
  marcadores.forEach(m => map.removeLayer(m));
  marcadores = [];
  data.forEach(registro => {
    // Toma el nombre exacto del campo, sin modificar nada
    const lat = parseFloat(registro['Latitud_Grados decimales']);
    const lon = parseFloat(registro['Longitud_Grados decimales']);
    if (isNaN(lat) || isNaN(lon)) return;

    const color = getColorForSpecies(registro['Especie'], especiesLista);

    const marker = L.circleMarker([lat, lon], {
      radius: 8,
      fillColor: color,
      color: "#444",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.78
    }).addTo(map);

    marker.bindPopup(`
      <b>Especie:</b> ${registro['Especie'] || "-"}<br>
      <b>Sexo:</b> ${registro['Sexo  '] || "-"}<br>
      <b>Madurez:</b> ${registro['Estadío (Adulto (A) Juvenil (J) Neonato (N) Preñada (P), No definido (ND)'] || "-"}<br>
      <b>LT (cm):</b> ${registro['LT (cm)'] || "-"}<br>
      <b>LD (cm):</b> ${registro['LD (cm)'] || "-"}<br>
      <b>Peso total (g):</b> ${registro['Peso total (g)'] || "-"}<br>
      <b>Pescador:</b> ${registro['Pescador:'] || "-"}<br>
      <b>Sitio:</b> ${registro['Sitio:'] || "-"}<br>
      <b>Fecha campamento/desembarco:</b> ${registro['Fecha campamento /Fecha desembarco'] || "-"}<br>
      <b>Lat:</b> ${registro['Latitud_Grados decimales']}<br>
      <b>Lon:</b> ${registro['Longitud_Grados decimales']}
    `);
    marcadores.push(marker);
  });
}

function getEspeciesSeleccionadas() {
  return Array.from(document.querySelectorAll("#especie-list-form input[type=checkbox]:checked")).map(x => x.value);
}

function aplicarFiltro() {
  const especiesSel = getEspeciesSeleccionadas();
  const sexo = document.getElementById('sexo').value;
  const madurez = document.getElementById('madurez').value;
  const filtrados = registros.filter(r =>
    especiesSel.includes(r['Especie']) &&
    (sexo === '' || r['Sexo  '] === sexo) &&
    (madurez === '' || r['Estadío (Adulto (A) Juvenil (J) Neonato (N) Preñada (P), No definido (ND)'] === madurez)
  );
  dibujarPuntos(filtrados, especiesSel);
  renderLegenda(especiesSel);
}

document.getElementById('filtrar').onclick = aplicarFiltro;
document.getElementById('reset').onclick = function() {
  document.querySelectorAll("#especie-list-form input[type=checkbox]").forEach(inp=>inp.checked=true);
  dibujarPuntos(registros, especies);
  renderLegenda(especies);
};

function renderLegenda(especiesLista) {
  const legendRows = document.getElementById('legend-rows');
  legendRows.innerHTML = especiesLista.map(e =>
    `<div class="legend-row">
      <span class="legend-color" style="background:${getColorForSpecies(e, especies)}"></span>
      ${e}
    </div>`
  ).join('');
}

document.getElementById('especie-list-form').addEventListener('change', aplicarFiltro);
