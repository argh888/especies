let registros = [];
let especies = [];
let marcadores = [];

const LAT_INICIAL = 24.4;
const LON_INICIAL = -110.3;
const ZOOM = 7;

const map = L.map('map').setView([LAT_INICIAL, LON_INICIAL], ZOOM);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

Papa.parse('data/especies.csv', {
  header: true,
  download: true,
  complete: function(results) {
    registros = results.data.filter(r =>
      r['Latitud_Grados_decimales'] && r['Longitud_Grados_decimales'] &&
      !isNaN(parseFloat(r['Latitud_Grados_decimales'])) &&
      !isNaN(parseFloat(r['Longitud_Grados_decimales']))
    );
    especies = [...new Set(registros.map(r => r['Especie']).filter(e => e))];
    inicializarFiltros(especies);
    dibujarPuntos(registros, especies, "");
    renderLegenda(especies);
  }
});

function inicializarFiltros(especiesLista) {
  // Multiselector de especies
  const especieForm = document.getElementById("especie-list-form");
  especieForm.innerHTML = especiesLista.map(especie =>
    `<div class="multiselect-item"><input type="checkbox" value="${especie}" checked> <span>${especie}</span></div>`
  ).join('');

  // Filtro de sexo (solo tres valores)
  const sexoSel = document.getElementById('sexo');
  const sexos = ["Indeterminado", "Macho", "Hembra"];
  sexoSel.innerHTML = `<option value="">Todos</option>${sexos.map(s => `<option>${s}</option>`).join('')}`;
}

function dibujarPuntos(data, especiesFiltradas, sexo) {
  marcadores.forEach(m => map.removeLayer(m));
  marcadores = [];
  data.forEach(registro => {
    if (!especiesFiltradas.includes(registro['Especie'])) return;
    if (sexo && registro['Sexo'] !== sexo) return;

    const lat = parseFloat(registro['Latitud_Grados_decimales']);
    const lon = parseFloat(registro['Longitud_Grados_decimales']);
    if (isNaN(lat) || isNaN(lon)) return;

    const color = getColorForSpecies(registro['Especie'], especies);
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
      <b>Sexo:</b> ${registro['Sexo'] || "-"}<br>
      <b>Lat:</b> ${registro['Latitud_Grados_decimales']}<br>
      <b>Lon:</b> ${registro['Longitud_Grados_decimales']}
    `);
    marcadores.push(marker);
  });
}

function getEspeciesSeleccionadas() {
  return Array.from(document.querySelectorAll("#especie-list-form input[type=checkbox]:checked")).map(x => x.value);
}

// --- Filtros en botones ---
document.getElementById('filtrar').onclick = function() {
  const especiesSel = getEspeciesSeleccionadas();
  const sexo = document.getElementById('sexo').value;
  dibujarPuntos(registros, especiesSel, sexo);
  renderLegenda(especiesSel);
};
document.getElementById('reset').onclick = function() {
  document.querySelectorAll("#especie-list-form input[type=checkbox]").forEach(inp => inp.checked = true);
  document.getElementById('sexo').value = "";
  dibujarPuntos(registros, especies, "");
  renderLegenda(especies);
};
document.getElementById('especie-list-form').addEventListener('change', function() {
  const especiesSel = getEspeciesSeleccionadas();
  const sexo = document.getElementById('sexo').value;
  dibujarPuntos(registros, especiesSel, sexo);
  renderLegenda(especiesSel);
});
document.getElementById('sexo').addEventListener('change', function() {
  const especiesSel = getEspeciesSeleccionadas();
  const sexo = document.getElementById('sexo').value;
  dibujarPuntos(registros, especiesSel, sexo);
  renderLegenda(especiesSel);
});

// --- Leyenda de especies mostradas (colores) ---
function renderLegenda(especiesLista) {
  const legendRows = document.getElementById('legend-rows');
  legendRows.innerHTML = especiesLista.map(e =>
    `<div class="legend-row">
      <span class="legend-color" style="background:${getColorForSpecies(e, especies)}"></span>
      ${e}
    </div>`
  ).join('');
}
