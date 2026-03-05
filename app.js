let registros = [];
let especies = [];
let marcadores = [];

const LAT_INICIAL = 24.4; // Centro de tu zona
const LON_INICIAL = -110.3;
const ZOOM = 7;

const map = L.map('map').setView([LAT_INICIAL, LON_INICIAL], ZOOM);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

Papa.parse('data/especies.csv', {
  header: true,
  download: true,
  complete: function(results) {
    const columnas = Object.keys(results.data[0]);
    alert("Detectadas columnas: \n\n" + columnas.join('\n'));
    console.log('PRIMER REGISTRO:', results.data[0]);

    // EXTRA: Detecta cuál es el primer campo de lat/lon que contiene valores numéricos válidos
    const registroEjemplo = results.data.find(r => Object.values(r).some(x => x && !isNaN(parseFloat(x))));
    let debug = [];
    for(const col of columnas) {
      debug.push(`${col} = ${registroEjemplo[col]}`);
    }
    alert("Valores reales en el primer registro:\n\n" + debug.join('\n'));

    // Trata de obtener los nombres REALES de las columnas para latitud y longitud
    let latCol = columnas.find(c => c.toLowerCase().includes('lat'));
    let lonCol = columnas.find(c => c.toLowerCase().includes('lon'));
    if (!latCol || !lonCol) {
      alert("No se detectaron columnas para latitud/longitud. Revisa el encabezado.");
      return;
    }

    // Filtra registros válidos
    registros = results.data.filter(r =>
      r[latCol] && r[lonCol] && !isNaN(parseFloat(r[latCol])) && !isNaN(parseFloat(r[lonCol]))
    );

    if(registros.length === 0){
      alert("No se detectaron registros válidos (¿coordenadas vacías o mal formateadas?)");
    }

    especies = [...new Set(registros.map(r => r['Especie']).filter(e => e))];
    inicializarFiltros(registros, especies);
    dibujarPuntos(registros, especies, latCol, lonCol);
    renderLegenda(especies);
  }
});

function inicializarFiltros(data, especiesLista) {
  const especieForm = document.getElementById("especie-list-form");
  especieForm.innerHTML = especiesLista.map(especie =>
    `<div class="multiselect-item"><input type="checkbox" value="${especie}" checked> <span>${especie}</span></div>`
  ).join('');

  // Filtros con nombres adaptados
  const sexoSel = document.getElementById('sexo');
  const madurezSel = document.getElementById('madurez');
  const sexos = [...new Set(data.map(r => r['Sexo  ']).filter(x => x))];
  const madureces = [...new Set(data.map(r => r['Estadío (Adulto (A) Juvenil (J) Neonato (N) Preñada (P), No definido (ND)']).filter(x => x))];

  sexoSel.innerHTML = `<option value="">Todos</option>${sexos.map(s => `<option>${s}</option>`).join('')}`;
  madurezSel.innerHTML = `<option value="">Todos</option>${madureces.map(m => `<option>${m}</option>`).join('')}`;
}

// Ajusta para pasar nombre de columna de lat/lon
function dibujarPuntos(data, especiesLista, latCol, lonCol) {
  marcadores.forEach(m => map.removeLayer(m));
  marcadores = [];
  data.forEach(registro => {
    const lat = parseFloat(registro[latCol]);
    const lon = parseFloat(registro[lonCol]);
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
      <b>Lat:</b> ${registro[latCol]}<br>
      <b>Lon:</b> ${registro[lonCol]}
    `);
    marcadores.push(marker);
  });
}

// ...resto igual...
function getEspeciesSeleccionadas() {
  return Array.from(document.querySelectorAll("#especie-list-form input[type=checkbox]:checked")).map(x => x.value);
}
function aplicarFiltro() {
  const especiesSel = getEspeciesSeleccionadas();
  const sexo = document.getElementById('sexo').value;
  const madurez = document.getElementById('madurez').value;

  // Filtros adaptados: podrías agregar auto-get de nombres de columnas si lo necesitas
  const filtrados = registros.filter(r =>
    especiesSel.includes(r['Especie']) &&
    (sexo === '' || r['Sexo  '] === sexo) &&
    (madurez === '' || r['Estadío (Adulto (A) Juvenil (J) Neonato (N) Preñada (P), No definido (ND)'] === madurez)
  );
  // Vuelve a usar auto-nombres de lat/lon:
  const columnas = Object.keys(filtrados[0]||{});
  let latCol = columnas.find(c => c.toLowerCase().includes('lat'));
  let lonCol = columnas.find(c => c.toLowerCase().includes('lon'));
  dibujarPuntos(filtrados, especiesSel, latCol, lonCol);
  renderLegenda(especiesSel);
}
document.getElementById('filtrar').onclick = aplicarFiltro;
document.getElementById('reset').onclick = function() {
  document.querySelectorAll("#especie-list-form input[type=checkbox]").forEach(inp=>inp.checked=true);
  aplicarFiltro();
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
