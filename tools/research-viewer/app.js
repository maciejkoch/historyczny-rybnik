import * as maplibregl from '/vendor/maplibre-gl.mjs';
const $ = (id) => document.getElementById(id);
const names = {
  overview: 'Podsumowanie',
  places: 'Miejsca',
  candidates: 'Kandydaci',
  'out-of-period': 'Poza okresem',
  sources: 'Źródła',
  materials: 'Materiały',
  research: 'Badania',
  tags: 'Tagi',
  map: 'Mapa 1932',
  graph: 'Sieć źródeł',
};
const states = {
  uncertain: 'Niepewne', conflicting: 'Sprzeczne', summary: 'Streszczenie', quote: 'Cytat', transcription: 'Transkrypcja', ocr: 'OCR',
  confirmed: 'Potwierdzone',
  probable: 'Brak potwierdzenia okresu',
  unverified: 'Nieustalone',
  outside: 'Poza okresem',
  pending: 'Do przejrzenia',
  accepted: 'Zaakceptowane',
  rejected: 'Odrzucone',
  merged: 'Połączone',
  'public-domain': 'Domena publiczna',
  unknown: 'Nieustalone prawa',
  licensed: 'Licencja',
  restricted: 'Ograniczone',
};
let data = null,
  view = 'overview',
  map = null,
  markers = [];
const node = (tag, text, cls) => {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
};
const button = (label, action, cls = 'btn btn-sm btn-outline') => {
  const b = node('button', label, cls);
  b.type = 'button';
  b.onclick = action;
  return b;
};
const status = (r) => r.period?.status || r.rights?.status || r.status || '';
const title = (r) => r.name || r.title || r.context || r.id;
const normalize = (s) =>
  s
    .toLocaleLowerCase('pl')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ł/g, 'l');
function link(url, label) {
  const a = node('a', label, 'link link-primary');
  try {
    const u = new URL(url, location.origin);
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password)
      return node('span', 'Nieprawidłowy odnośnik');
    a.href = u.href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  } catch {
    return node('span', 'Brak odnośnika');
  }
}
function find(id) {
  for (const key of [
    'places',
    'out-of-period',
    'sources',
    'materials',
    'candidates',
    'research',
    'tags',
  ]) {
    const r = data[key].find((r) => r.id === id);
    if (r) return { key, r };
  }
  return null;
}
function ref(id) {
  const item = find(id);
  return item
    ? button(
        title(item.r),
        () => detail(item.key, item.r),
        'btn btn-xs btn-ghost underline justify-start h-auto min-h-7 whitespace-normal',
      )
    : node('span', 'Brak rekordu: ' + id, 'text-error');
}
function heading(parent, text) {
  parent.append(node('h3', text));
}
function dated(d) {
  return d ? `${d.approximate ? 'około ' : ''}${d.from}${d.to ? ' – ' + d.to : ''}` : 'nieustalona';
}
function evidence(parent, items) {
  for (const e of items) {
    const p = node('p');
    p.append(ref(e.materialId), node('span', ' · ' + e.locator + (e.note ? ' · ' + e.note : '')));
    parent.append(p);
  }
}
function detail(key, r) {
  const box = $('detail-body');
  box.replaceChildren(
    node('p', names[key] || key, 'text-xs uppercase opacity-60'),
    node('h2', title(r), 'text-2xl font-serif pr-8'),
  );
  if (status(r)) box.append(node('p', states[status(r)] || status(r), 'badge badge-outline my-3'));
  if (r.period) box.append(node('p', r.period.explanation, 'alert alert-warning'));
  if (r.description) box.append(node('p', r.description));
  if (r.url) box.append(link(r.url, 'Otwórz źródło ↗'));
  if (r.tags) {
    const row = node('div', undefined, 'flex flex-wrap gap-2 my-3');
    for (const t of r.tags) row.append(ref(t));
    box.append(row);
  }
  if (r.addresses) {
    heading(box, 'Adresy i nazwy');
    for (const a of r.addresses)
      box.append(
        node('p', `${a.type === 'historical' ? 'Historyczny' : 'Współczesny'}: ${a.text}`),
      );
    box.append(node('p', (r.aliases || []).join(' · ')));
  }
  if (r.publicationDate !== undefined) {
    heading(box, 'Datowanie');
    box.append(
      node('p', 'Powstanie / publikacja: ' + dated(r.publicationDate)),
      node('p', 'Dotyczy: ' + dated(r.historicalDate)),
    );
    if (r.dateNote) box.append(node('p', r.dateNote));
  }
  if (r.findings) {
    heading(box, 'Ustalenia i dowody');
    for (const f of r.findings) {
      box.append(node('p', f.text, 'font-medium'), node('p', states[f.status] || f.status, 'text-sm opacity-60'));
      evidence(box, f.evidence);
    }
  }
  if (r.period?.evidence.length) {
    heading(box, 'Podstawa kwalifikacji okresu');
    evidence(box, r.period.evidence);
  }
  if (r.evidence) {
    heading(box, 'Wzmianki źródłowe');
    evidence(box, r.evidence);
  }
  for (const [field, label] of [
    ['materialIds', 'Materiały'],
    ['placeIds', 'Miejsca'],
    ['relatedPlaceIds', 'Powiązane miejsca'],
    ['possibleDuplicateIds', 'Możliwe duplikaty'],
  ])
    if (r[field]?.length) {
      heading(box, label);
      for (const id of r[field]) box.append(ref(id));
    }
  if (r.relatedPlaces?.length) {
    heading(box, 'Powiązane miejsca');
    for (const rel of r.relatedPlaces) {
      const p = node('p');
      p.append(ref(rel.placeId), node('span', rel.note ? ' — ' + rel.note : ''));
      if (rel.materialId) p.append(ref(rel.materialId));
      box.append(p);
    }
  }
  if (r.discoveredFrom?.length) {
    heading(box, 'Odkryte przez');
    for (const edge of r.discoveredFrom) {
      const p = node('p');
      p.append(ref(edge.sourceId), node('span', ' · ' + edge.locator));
      box.append(p);
    }
  }
  if (key === 'sources') {
    heading(box, 'Materiały tego źródła');
    for (const m of data.materials.filter((m) => m.sourceId === r.id)) box.append(ref(m.id));
  }
  if (r.sourceId) {
    heading(box, 'Źródło');
    box.append(ref(r.sourceId));
  }
  if (r.parentMaterialId) {
    heading(box, 'Materiał nadrzędny');
    box.append(ref(r.parentMaterialId));
  }
  if (r.content) {
    heading(box, 'Treść / odczyt');
    box.append(
      node('p', states[r.contentType] || r.contentType, 'text-sm opacity-60'),
      node('pre', r.content, 'bg-base-200 rounded-box p-4'),
    );
  }
  if (r.rights) {
    heading(box, 'Prawa');
    box.append(
      node('p', states[r.rights.status] || r.rights.status),
      node('p', r.rights.basis || 'Brak ustalonej podstawy'),
      node('p', 'Sprawdzono: ' + (r.rights.checkedAt || 'nie sprawdzono')),
      node('p', 'Publikacja: ' + (r.rights.publicationApproved ? 'dopuszczona' : 'niedopuszczona')),
    );
    if (r.rights.evidenceUrl) box.append(link(r.rights.evidenceUrl, 'Dowód praw ↗'));
  }
  if (r.files?.length) {
    heading(box, 'Pliki lokalne');
    for (const file of r.files) {
      const url = '/files/' + file.path.slice(6).split('/').map(encodeURIComponent).join('/');
      box.append(link(url, file.role + ' · ' + file.path));
      if (/\.(png|jpg|jpeg|webp)$/i.test(file.path)) {
        const img = node('img', undefined, 'max-h-96 my-3 rounded-box');
        img.src = url;
        img.alt = r.title || file.path;
        img.loading = 'lazy';
        box.append(img);
      }
      box.append(node('p', file.sha256, 'text-xs break-all opacity-60'));
    }
  }
  if (r.resolvedPlaceId) box.append(ref(r.resolvedPlaceId));
  if (r.reason) box.append(node('p', r.reason));
  if (r.decisionNote) box.append(node('p', r.decisionNote));
  if (r.questions?.length) {
    heading(box, 'Do wyjaśnienia');
    for (const q of r.questions) box.append(node('p', '• ' + q));
  }
  if (key === 'tags') {
    heading(box, 'Miejsca z tagiem');
    for (const p of [...data.places, ...data['out-of-period']].filter((p) => p.tags.includes(r.id)))
      box.append(ref(p.id));
  }
  if (key === 'research') {
    heading(box, 'Raport');
    box.append(node('p', r.summary));
    for (const s of r.searches) box.append(node('p', `${s.query} · ${s.outcome} · ${s.note}`));
    for (const c of r.changes) {
      const p = node('p', c.action + ' · ');
      p.append(ref(c.id));
      box.append(p);
    }
    heading(box, 'Dalsze tropy');
    for (const l of r.leads) {
      box.append(node('p', l.note + ' · ' + l.status));
      if (l.url) box.append(link(l.url, l.url));
    }
    for (const l of r.limitations) box.append(node('p', l));
  }
  const disclosure = node('details', undefined, 'mt-6');
  disclosure.append(
    node('summary', 'Pełny rekord', 'cursor-pointer text-sm opacity-60'),
    node('pre', JSON.stringify(r, null, 2), 'text-xs mt-3'),
  );
  box.append(disclosure);
  if (!$('detail').open) $('detail').showModal();
}
function filtered(rows) {
  const q = normalize($('search').value);
  return rows.filter(
    (r) =>
      (!q || normalize(JSON.stringify(r)).includes(q)) &&
      (!$('tag').value || r.tags?.includes($('tag').value)) &&
      (!$('status').value || status(r) === $('status').value) &&
      (!$('location').value ||
        ($('location').value === 'known') === Boolean(r.location?.coordinates)),
  );
}
function overview() {
  const box = $('overview');
  box.replaceChildren(
    node('p', 'Trwała pamięć poszukiwań', 'text-xs uppercase tracking-widest opacity-60'),
    node('h2', 'Co już wiemy o mieście', 'font-serif text-3xl mt-2 mb-6'),
  );
  const grid = node('div', undefined, 'grid grid-cols-2 lg:grid-cols-4 gap-4');
  for (const key of ['places', 'sources', 'materials', 'candidates']) {
    const card = button(
      '',
      () => select(key),
      'card bg-base-100 p-5 text-left border border-base-300',
    );
    card.append(
      node('span', String(data[key].length), 'font-serif text-4xl'),
      node('span', names[key], 'text-sm opacity-70 mt-2'),
    );
    grid.append(card);
  }
  box.append(grid);
  const unconfirmed = data.places.filter((p) => p.period.status !== 'confirmed').length,
    rights = data.materials.filter((m) => m.rights.status === 'unknown').length;
  box.append(
    node(
      'p',
      `${unconfirmed} miejsc bez potwierdzenia okresu · ${rights} materiałów z nieustalonymi prawami · ${data['out-of-period'].length} miejsc na przyszłość`,
      'my-6 text-sm opacity-70',
    ),
  );
  heading(box, 'Ostatnie badania');
  for (const r of data.research
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6)) {
    const c = node('article', undefined, 'card bg-base-100 border border-base-300 p-5 my-3');
    c.append(ref(r.id), node('p', r.summary), node('p', r.updatedAt, 'text-xs opacity-60'));
    box.append(c);
  }
  if (!data.research.length)
    box.append(
      node(
        'p',
        'Brak badań. Zbiór jest gotowy na pierwsze uruchomienie skilla.',
        'my-4 opacity-60',
      ),
    );
}
function render() {
  if (!data) return;
  if (view === 'overview') {
    overview();
    return;
  }
  const rows = filtered(
    view === 'map'
      ? [...data.places, ...data['out-of-period'], ...data.candidates]
      : view === 'graph'
        ? data.sources
        : data[view],
  );
  $('count').textContent = `${rows.length} rekordów`;
  $('cards').replaceChildren();
  if (view === 'map') {
    renderMap(rows);
    return;
  }
  if (view === 'graph') {
    renderGraph(rows);
    return;
  }
  for (const r of rows) {
    const card = node('article', undefined, 'card bg-base-100 border border-base-300 p-5 gap-3');
    card.append(
      button(
        title(r),
        () => detail(view, r),
        'text-left font-serif text-lg underline-offset-4 hover:underline cursor-pointer',
      ),
    );
    if (status(r))
      card.append(
        node('p', states[status(r)] || status(r), 'badge badge-outline text-xs h-auto py-1'),
      );
    card.append(
      node('p', (r.description || r.reason || r.summary || '').slice(0, 180), 'text-sm opacity-70'),
    );
    if (view === 'tags')
      card.append(
        node(
          'p',
          `${[...data.places, ...data['out-of-period']].filter((p) => p.tags.includes(r.id)).length} miejsc`,
          'text-sm',
        ),
      );
    if (r.publicationDate !== undefined)
      card.append(node('p', dated(r.publicationDate), 'text-xs opacity-60'));
    $('cards').append(card);
  }
  if (!rows.length)
    $('cards').append(node('p', 'Brak rekordów pasujących do filtrów.', 'opacity-60'));
}
function select(key) {
  view = key;
  location.hash = key;
  $('overview').hidden = key !== 'overview';
  $('browser').hidden = key === 'overview';
  $('heading').textContent = names[key];
  $('cards').hidden = ['map', 'graph'].includes(key);
  $('map-panel').hidden = key !== 'map';
  $('graph-panel').hidden = key !== 'graph';
  $('tag').hidden = !['places', 'out-of-period', 'map'].includes(key);
  $('location').hidden = !['places', 'out-of-period', 'candidates', 'map'].includes(key);
  $('search').value = '';
  $('tag').value = '';
  $('location').value = '';
  $('status').replaceChildren(node('option', 'Wszystkie stany'));
  $('status').firstChild.value = '';
  const rows =
    key === 'map'
      ? [...data.places, ...data['out-of-period'], ...data.candidates]
      : data[key] || [];
  for (const state of new Set(rows.map(status).filter(Boolean))) {
    const o = node('option', states[state] || state);
    o.value = state;
    $('status').append(o);
  }
  for (const b of $('nav').children) b.classList.toggle('menu-active', b.dataset.key === key);
  render();
}
function renderMap(rows) {
  if (!map) {
    map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        sources: {
          history: {
            type: 'raster',
            tiles: [location.origin + '/maptiles/{z}/{x}/{y}.webp'],
            tileSize: 256,
            minzoom: 10,
            maxzoom: 18,
            bounds: [18.4857, 50.0564, 18.6541, 50.1348],
            attribution: 'Plan Rybnika 1932 · MBC · domena publiczna',
          },
        },
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#dadfd7' } },
          { id: 'history', type: 'raster', source: 'history' },
        ],
      },
      center: [18.542, 50.096],
      zoom: 14,
      maxZoom: 19,
      minZoom: 10,
    });
    map.addControl(new maplibregl.NavigationControl());
  }
  map.resize();
  markers.forEach((m) => m.remove());
  markers = [];
  for (const r of rows.filter((r) => r.location?.coordinates)) {
    const b = button(
      r.period?.status === 'confirmed'
        ? '●'
        : r.period?.status === 'probable'
          ? '◐'
          : r.status
            ? '◆'
            : '○',
      () => {
        const i = find(r.id);
        detail(i.key, r);
      },
      'map-marker ' + (r.period?.status || 'candidate'),
    );
    b.setAttribute('aria-label', title(r));
    markers.push(
      new maplibregl.Marker({ element: b })
        .setLngLat([r.location.coordinates.lng, r.location.coordinates.lat])
        .addTo(map),
    );
  }
  $('map-list').replaceChildren(
    node(
      'p',
      `${rows.filter((r) => !r.location?.coordinates).length} rekordów bez współrzędnych — dostępne poniżej`,
      'mb-3 text-sm',
    ),
  );
  for (const r of rows) $('map-list').append(ref(r.id));
}
function renderGraph(rows) {
  const box = $('graph-panel');
  box.replaceChildren(
    node(
      'p',
      'Wybierz źródło. Strzałka A → B oznacza: A wskazuje B. Wspólne cytowanie nie jest niezależnym potwierdzeniem.',
      'mb-4 text-sm',
    ),
  );
  if (!rows.length) {
    box.append(node('p', 'Brak źródeł.'));
    return;
  }
  const picker = node('select', undefined, 'select w-full mb-4');
  picker.setAttribute('aria-label','Źródło w centrum grafu');
  for (const r of rows) {
    const o = node('option', r.name);
    o.value = r.id;
    picker.append(o);
  }
  box.append(picker);
  const area = node('div');
  box.append(area);
  const draw = () => {
    area.replaceChildren();
    const center = rows.find((r) => r.id === picker.value),
      edges = [];
    for (const s of data.sources)
      for (const e of s.discoveredFrom)
        if (s.id === center.id || e.sourceId === center.id)
          edges.push({ from: e.sourceId, to: s.id, note: e.locator });
    const ids = [
      center.id,
      ...new Set(edges.flatMap((e) => [e.from, e.to]).filter((id) => id !== center.id)),
    ];
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 900 480');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Powiązania źródła ' + center.name);
    const pos = new Map(
      ids.map((id, i) => [
        id,
        i === 0
          ? [450, 240]
          : [
              450 + 310 * Math.cos(((i - 1) * 2 * Math.PI) / Math.max(1, ids.length - 1)),
              240 + 175 * Math.sin(((i - 1) * 2 * Math.PI) / Math.max(1, ids.length - 1)),
            ],
      ]),
    );
    for (const e of edges) {
      const a = pos.get(e.from),
        b = pos.get(e.to),
        line = document.createElementNS(svg.namespaceURI, 'line');
      for (const [k, v] of Object.entries({ x1: a[0], y1: a[1], x2: b[0], y2: b[1] }))
        line.setAttribute(k, v);
      svg.append(line);
      const t = document.createElementNS(svg.namespaceURI, 'text');
      t.setAttribute('x', (a[0] + b[0]) / 2);
      t.setAttribute('y', (a[1] + b[1]) / 2);
      t.textContent = '→';
      svg.append(t);
    }
    for (const id of ids) {
      const [x, y] = pos.get(id),
        g = document.createElementNS(svg.namespaceURI, 'g'),
        c = document.createElementNS(svg.namespaceURI, 'circle'),
        t = document.createElementNS(svg.namespaceURI, 'text');
      c.setAttribute('cx', x);
      c.setAttribute('cy', y);
      c.setAttribute('r', id === center.id ? 15 : 10);
      c.setAttribute('fill', '#245947');
      t.setAttribute('x', x);
      t.setAttribute('y', y + 30);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '12');
      t.textContent = title(find(id).r).slice(0, 40);
      g.append(c, t);
      g.style.cursor = 'pointer';
      g.onclick = () => detail('sources', find(id).r);
      svg.append(g);
    }
    area.append(svg);
    for (const e of edges) {
      const p = node('p', undefined, 'my-3');
      p.append(ref(e.from), node('span', ' → '), ref(e.to), node('span', ' · ' + e.note));
      area.append(p);
    }
    if (!edges.length)
      area.append(node('p', 'To źródło nie ma jeszcze zapisanych powiązań.', 'my-4'));
  };
  picker.onchange = draw;
  draw();
}
async function load() {
  try {
    const response = await fetch('/api/workspace');
    const payload = await response.json();
    $('errors').replaceChildren();
    if (!response.ok) throw new Error(payload.error || 'Nie można odczytać danych');
    data = payload;
    $('tag').replaceChildren(node('option', 'Wszystkie tagi'));
    $('tag').firstChild.value = '';
    for (const tag of data.tags) {
      const o = node('option', tag.name);
      o.value = tag.id;
      $('tag').append(o);
    }
    select(names[location.hash.slice(1)] ? location.hash.slice(1) : view);
  } catch (e) {
    $('errors').replaceChildren(
      node('p', 'Nie można odczytać warsztatu: ' + e.message, 'alert alert-error mb-6'),
    );
  }
}
for (const [key, label] of Object.entries(names)) {
  const b = button(label, () => select(key), 'text-left rounded-lg px-3 py-2 hover:bg-base-200');
  b.dataset.key = key;
  $('nav').append(b);
}
for (const id of ['search', 'tag', 'status', 'location']) $(id).addEventListener('input', render);
$('reload').onclick = load;
window.addEventListener('hashchange', () => {
  const key = location.hash.slice(1);
  if (data && names[key] && key !== view) select(key);
});
load();
