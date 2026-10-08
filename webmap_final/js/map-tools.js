/* Additional controls for the existing qgis2web Leaflet map. */
(function () {
  'use strict';
  var map = window.map;
  var colors = window.DENKMAL_COLORS;
  if (!map || !colors) return;
  window.DENKMAL_MAP_TOOLS_READY = false;
  var germany = window.layer_BBL_2.getBounds();
  var points = window.layer_Gefhrdung_3;
  var carto = window.layer_CARTOPositron_1;
  var searchMarker = null;
  var searchBox;

  function clearSelection(reason) {
    window.dispatchEvent(new CustomEvent('denkmals:clear-selection', { detail: { reason: reason } }));
  }
  function germanyOverview() {
    clearSelection('overview');
    map.stop();
    map.closePopup();
    if (searchMarker) {
      map.removeLayer(searchMarker);
      searchMarker = null;
    }
    if (searchBox) searchBox.search.hide();
    map.invalidateSize({ pan: false });
    map.fitBounds(germany, {
      paddingTopLeft: [28, window.innerWidth < 650 ? 100 : 65],
      paddingBottomRight: [28, 42],
      maxZoom: 8,
      animate: false
    });
  }
  points.eachLayer(function (layer) {
    var category = layer.feature.properties.kategorie;
    if (colors[category]) layer.setStyle({ fillColor: colors[category] });
  });

  var dark = window.layer_CARTODarkMatter_0;
  if (map.hasLayer(dark)) map.removeLayer(dark);
  map.options.zoomSnap = 0.1;
  map.options.zoomDelta = 0.5;
  map.attributionControl.addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>-Mitwirkende &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>');


  var toolbar = L.control({ position: 'topright' });
  toolbar.onAdd = function () {
    var box = L.DomUtil.create('div', 'map-toolbar');
    L.DomEvent.disableClickPropagation(box);
    L.DomEvent.disableScrollPropagation(box);
    var overview = document.createElement('button');
    overview.type = 'button';
    overview.className = 'overview-button';
    overview.id = 'germany-overview';
    overview.textContent = 'Deutschlandübersicht';
    overview.title = 'Alle zwölf Fälle und Deutschland wieder anzeigen';
    overview.addEventListener('click', germanyOverview);
    box.appendChild(overview);
    var switcher = document.createElement('div');
    switcher.className = 'basemap-switcher';
    switcher.setAttribute('role', 'group');
    switcher.setAttribute('aria-label', 'Hintergrundkarte auswählen');
    [['hell', 'Hell', 'CARTO Positron'], ['dark', 'Dunkel', 'CARTO Dark Matter']].forEach(function (entry) {
      var button = document.createElement('button');
      button.type = 'button';
      button.dataset.basemap = entry[0];
      button.textContent = entry[1];
      button.title = entry[2];
      button.setAttribute('aria-pressed', entry[0] === 'hell' ? 'true' : 'false');
      button.addEventListener('click', function () {
        var desired = entry[0] === 'hell' ? carto : dark;
        var other = entry[0] === 'hell' ? dark : carto;
        if (map.hasLayer(other)) map.removeLayer(other);
        if (!map.hasLayer(desired)) desired.addTo(map);
        switcher.querySelectorAll('button').forEach(function (item) {
          item.setAttribute('aria-pressed', String(item === button));
        });
        map.fire('baselayerchange', { name: entry[2], layer: desired });
      });
      switcher.appendChild(button);
    });
    box.appendChild(switcher);
    return box;
  };
  toolbar.addTo(map);

  var legend = L.control({ position: 'bottomleft' });
  legend.onAdd = function () {
    var box = L.DomUtil.create('div', 'map-legend');
    L.DomEvent.disableClickPropagation(box);
    L.DomEvent.disableScrollPropagation(box);
    var details = document.createElement('details');
    details.open = window.innerWidth >= 650;
    var summary = document.createElement('summary');
    summary.textContent = 'Gefährdung';
    details.appendChild(summary);
    Object.keys(colors).forEach(function (category) {
      var row = document.createElement('div');
      row.className = 'legend-row';
      var dot = document.createElement('span');
      dot.className = 'legend-swatch';
      dot.dataset.category = category;
      dot.style.backgroundColor = colors[category];
      row.appendChild(dot);
      row.appendChild(document.createTextNode(category));
      details.appendChild(row);
    });
    var toggles = document.createElement('div'); toggles.className = 'source-layer-toggles';
    [['Gefährdung', points], ['BBL', window.layer_BBL_2]].forEach(function (entry) {
      var label = document.createElement('label'); var check = document.createElement('input');
      check.type = 'checkbox'; check.checked = map.hasLayer(entry[1]);
      check.addEventListener('change', function () { if (check.checked) entry[1].addTo(map); else map.removeLayer(entry[1]); });
      map.on('layeradd layerremove', function () { check.checked = map.hasLayer(entry[1]); });
      label.appendChild(check); label.appendChild(document.createTextNode(' ' + entry[0])); toggles.appendChild(label);
    });
    details.appendChild(toggles);
    box.appendChild(details);
    return box;
  };
  legend.addTo(map);
  L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

  function resultName(feature) {
    var props = feature.properties || {};
    return props.display_name || props.label || props.name || [props.street, props.housenumber].filter(Boolean).join(' ') || 'Adresse';
  }
  function addressLine(feature) {
    var props = feature.properties || {};
    return [[props.street, props.housenumber].filter(Boolean).join(' '),
      [props.postcode, props.city || props.town || props.village].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  }
  searchBox = L.control.photon({
    position: 'topleft',
    url: 'https://nominatim.openstreetmap.org/search?format=geojson&addressdetails=1&',
    placeholder: 'Adresse in Deutschland suchen …',
    lang: 'de',
    limit: 5,
    minChar: 3,
    submitDelay: 800,
    includePosition: false,
    bbox: [germany.getWest(), germany.getSouth(), germany.getEast(), germany.getNorth()],
    noResultLabel: 'Keine Adresse gefunden.',
    feedbackEmail: null,
    formatResult: function (feature, element) {
      var title = document.createElement('strong');
      title.textContent = resultName(feature);
      var detail = document.createElement('small');
      detail.textContent = addressLine(feature) || (feature.properties || {}).city || 'Deutschland';
      element.appendChild(title);
      element.appendChild(detail);
    },
    onSelected: function (feature) {
      if (!feature.geometry || !Array.isArray(feature.geometry.coordinates)) return;
      var xy = feature.geometry.coordinates;
      if (!Number.isFinite(xy[0]) || !Number.isFinite(xy[1])) return;
      clearSelection('search');
      map.closePopup();
      if (searchMarker) map.removeLayer(searchMarker);
      searchMarker = L.circleMarker([xy[1], xy[0]], {
        radius: 7, color: '#0f172a', weight: 3, fillColor: '#ffffff', fillOpacity: 1
      }).addTo(map);
      var content = document.createElement('div');
      content.className = 'address-popup';
      var type = document.createElement('small');
      type.textContent = 'Suchergebnis · keine zusätzliche Denkmal-Fallstelle';
      var title = document.createElement('strong');
      title.textContent = resultName(feature);
      var description = document.createElement('div');
      description.textContent = addressLine(feature);
      content.appendChild(type);
      content.appendChild(title);
      content.appendChild(description);
      searchMarker.bindPopup(content);
      map.setView([xy[1], xy[0]], 15, { animate: false });
      searchMarker.openPopup();
      searchBox.input.value = resultName(feature);
    }
  }).addTo(map);
  searchBox.input.setAttribute('aria-label', 'Adresse in Deutschland suchen');
  searchBox.input.setAttribute('spellcheck', 'false');
  searchBox.search.resultsContainer.setAttribute('aria-label', 'Adresssuchergebnisse');

  var engine = searchBox.search;
  L.DomEvent.off(searchBox.input, 'input', engine.onInput, engine);
  L.DomEvent.off(searchBox.input, 'focus', engine.onFocus, engine);
  L.DomEvent.on(searchBox.input, 'input', function () { engine.hide(); });
  L.DomEvent.on(searchBox.input, 'focus', function () { engine.fire('focus'); });
  var oldBlur = engine.onBlur;
  L.DomEvent.off(searchBox.input, 'blur', oldBlur, engine);
  L.DomEvent.on(searchBox.input, 'blur', function (event) { if (event.relatedTarget && event.relatedTarget.classList.contains('search-submit')) return; oldBlur.call(engine, event); });
  var manualCache = new Map();
  var lastRequest = 0;
  var submit = document.createElement('button');
  submit.type = 'button'; submit.className = 'search-submit'; submit.textContent = 'Suchen';
  submit.addEventListener('click', function () { engine.search(); });
  searchBox.getContainer().appendChild(submit);

  var originalKeyDown = searchBox.search.onKeyDown;
  L.DomEvent.off(searchBox.input, 'keydown', originalKeyDown, searchBox.search);
  searchBox.search.onKeyDown = function (event) {
    if (event.key === 'Tab') { this.hide(); return; }
    if (event.key === 'Enter' && this.RESULTS.length === 0) {
      L.DomEvent.stop(event);
      this.search();
      return;
    }
    originalKeyDown.call(this, event);
  };
  L.DomEvent.on(searchBox.input, 'keydown', searchBox.search.onKeyDown, searchBox.search);
  searchBox.search.getParams = function () {
    return {q: this.input.value.trim(), format:'geojson', addressdetails:1, 'accept-language':'de', limit:5, countrycodes:'de', viewbox:[germany.getWest(),germany.getNorth(),germany.getEast(),germany.getSouth()].join(','), bounded:1};
  };
  // Add network/error feedback without altering the bundled Photon library.
  searchBox.search.ajax = function (callback, thisObject) {
    var query = this.input.value.trim();
    if (manualCache.has(query)) { callback.call(thisObject || this, manualCache.get(query)); return; }
    if (Date.now() - lastRequest < 1100) { this.CACHE = ''; return; }
    lastRequest = Date.now();
    if (this.xhr) this.xhr.abort();
    var self = this;
    var xhr = new XMLHttpRequest();
    this.xhr = xhr;
    function fail() {
      if (self.xhr !== xhr) return;
      self.fire('ajax:return');
      self.clear();
      var item = document.createElement('li');
      item.className = 'photon-no-result';
      item.textContent = 'Adresssuche nicht erreichbar. Internet prüfen und erneut versuchen.';
      self.resultsContainer.appendChild(item);
      self.resultsContainer.style.display = 'block';
      self.resizeContainer();
      delete self.xhr;
    }
    xhr.open('GET', this.options.url + this.buildQueryString(this.getParams()), true);
    xhr.timeout = 12000;
    xhr.onload = function () {
      if (self.xhr !== xhr) return;
      if (xhr.status !== 200) { fail(); return; }
      try {
        var data = JSON.parse(xhr.responseText);
        if (!data || !Array.isArray(data.features)) throw new Error('Invalid response');
        self.fire('ajax:return');
        manualCache.set(query, data);
        callback.call(thisObject || self, data);
        delete self.xhr;
      } catch (error) { fail(); }
    };
    xhr.onerror = fail;
    xhr.ontimeout = fail;
    self.fire('ajax:send');
    xhr.send();
  };
  // Search above zoom buttons, rather than a hidden control below them.
  if (window.zoomControl) {
    window.zoomControl.remove();
    window.zoomControl.addTo(map);
  }
  window.DENKMAL_MAP_TOOLS = {
    overview: germanyOverview,
    germanyBounds: germany,
    search: searchBox,
    dark: dark,
    carto: carto
  };
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      germanyOverview();
      window.DENKMAL_MAP_TOOLS_READY = true;
      window.dispatchEvent(new Event('denkmals:tools-ready'));
    });
  });
  window.addEventListener('resize', function () { map.invalidateSize({ pan: false }); });
})();
