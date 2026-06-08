// mapa-rutas.js — inicializa mapa, carga CSVs y maneja marcadores/lista
document.addEventListener('DOMContentLoaded', () => {
  // Mapbox token
  mapboxgl.accessToken = window.MAPBOX_TOKEN;

  const map = new mapboxgl.Map({
    container: 'mapa',
    style: 'mapbox://styles/mapbox/streets-v11',
    //style: 'mapbox://styles/victoria1022/cmq5jxgy4006701qu8epif7eb',
    center: [-99.1332, 19.4326],
    zoom: 11
  });

  // Paths to CSV files (use encodeURI when fetching)
  const DATA_FILES = {
    museos: './data/museos_cdmx_coordenadas.xlsx - Museos_CDMX.csv',
    cafeterias: './data/cafeterias_cdmx_coordenadas.xlsx - Cafeterias_CDMX.csv'
  };

  const menuLinks = document.querySelectorAll('.rutas-menu a');
  const lista = document.getElementById('lista-lugares');
  const listaTitulo = document.getElementById('lista-titulo');
  const listaWrapper = document.getElementById('lista-lugares-wrapper');

  let currentMarkers = [];

  function clearMarkers() {
    currentMarkers.forEach(m => {
      try { m.marker.remove(); } catch (e) {}
      try { if (m.popup) m.popup.remove(); } catch (e) {}
    });
    currentMarkers = [];
  }

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];
    const splitRow = row => row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());
    const headers = splitRow(lines[0]).map(h => h.toLowerCase());
    const rows = lines.slice(1).map(line => {
      const vals = splitRow(line);
      const obj = {};
      headers.forEach((h, i) => obj[h] = vals[i] || '');
      return obj;
    });
    return rows;
  }

  function toNumberCoord(str) {
    if (!str) return NaN;
    // replace comma decimal separator with dot
    return parseFloat(str.replace(/\s/g, '').replace(',', '.'));
  }

  function renderLista(lugaresArray, categoriaNombre) {
    // lugaresArray: array of currentMarkers entries ({ marker, popup, lngLat, nombre })
    listaTitulo.textContent = (categoriaNombre || '') + (categoriaNombre ? ':' : '');
    lista.innerHTML = '';

    if (!lugaresArray || lugaresArray.length === 0) {
      const p = document.createElement('div');
      p.textContent = 'Próximamente';
      p.style.padding = '12px 0';
      lista.appendChild(p);
      return;
    }

    const columnas = [[], [], []];
    lugaresArray.forEach((lugar, index) => columnas[index % 3].push({ lugar, index }));

    columnas.forEach(col => {
      const columnaDiv = document.createElement('div');
      columnaDiv.classList.add('lista-columna');

      col.forEach(obj => {
        const item = document.createElement('button');
        item.classList.add('lugar-item');
        item.textContent = obj.lugar.nombre || obj.lugar.nombre || obj.lugar.Nombre || 'Lugar';
        item.type = 'button';
        item.addEventListener('click', () => {
          const m = currentMarkers[obj.index];
          if (!m) return;
          map.flyTo({ center: m.lngLat, zoom: 15 });
          if (m.popup) m.popup.addTo(map);
        });

        columnaDiv.appendChild(item);
      });

      lista.appendChild(columnaDiv);
    });
  }

  async function loadCategory(cat) {
    clearMarkers();
    lista.innerHTML = '';
    if (!DATA_FILES[cat]) {
      if (listaWrapper) listaWrapper.style.display = 'none';
      return; // no data for this category
    }

    try {
      const path = encodeURI(DATA_FILES[cat]);
      const res = await fetch(path);
      if (!res.ok) throw new Error('No se pudo cargar ' + path);
      const text = await res.text();
      const rows = parseCSV(text);

      const features = [];
      rows.forEach(r => {
        // support headers named Nombre/Latitud/Longitud (case-insensitive)
        const nombre = r.nombre || r.Nombre || r.Nombre || r.Nombre || r.Nombre || r['nombre'];
        const latStr = r.latitud || r.Latitud || r.Lat || r['latitud'];
        const lonStr = r.longitud || r.Longitud || r.Lon || r['longitud'];
        const lat = toNumberCoord(latStr);
        const lon = toNumberCoord(lonStr);
        if (isFinite(lat) && isFinite(lon)) {
          features.push({ nombre: nombre || 'Lugar', lat, lon });
        }
      });

      if (features.length === 0) {
        if (listaWrapper) listaWrapper.style.display = 'none';
        return;
      }

      // add markers
      features.forEach(f => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.width = '18px';
        el.style.height = '18px';
        el.style.background = '#ea5c1c';
        el.style.borderRadius = '50%';
        el.style.boxShadow = '0 0 0 3px rgba(234,92,28,0.12)';

        const marker = new mapboxgl.Marker(el).setLngLat([f.lon, f.lat]).addTo(map);
        const popup = new mapboxgl.Popup({ offset: 12 }).setHTML(`<strong>${f.nombre}</strong>`);
        marker.getElement().addEventListener('click', () => popup.addTo(map));

        currentMarkers.push({ marker, popup, lngLat: [f.lon, f.lat], nombre: f.nombre });
      });

      // adjust viewport to markers
      if (currentMarkers.length === 1) {
        map.flyTo({ center: currentMarkers[0].lngLat, zoom: 14 });
      } else {
        const bounds = new mapboxgl.LngLatBounds();
        currentMarkers.forEach(m => bounds.extend(m.lngLat));
        map.fitBounds(bounds, { padding: 80, maxZoom: 14 });
      }

      // build list (3-column layout)
      const displayName = cat === 'museos' ? 'MUSEOS' : cat === 'cafeterias' ? 'CAFETERÍAS' : '';
      renderLista(currentMarkers, displayName);
      if (listaWrapper) listaWrapper.style.display = 'block';

    } catch (err) {
      console.error(err);
    }
  }

  // menu behavior: hover handled in CSS; clicks handled here
  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      // set active class
      menuLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const href = link.getAttribute('href') || '';
      const id = href.replace('#', '').toLowerCase();
      if (id === 'museos') {
        loadCategory('museos');
      } else if (id === 'cafeterias') {
        loadCategory('cafeterias');
      } else {
        // ESCUELAS or ZONAS DE RIESGO: clear markers/list but keep UI active
        clearMarkers();
        lista.innerHTML = '';
        if (listaWrapper) listaWrapper.style.display = 'none';
      }
    });
  });

  // set initial state (no active category)
});
