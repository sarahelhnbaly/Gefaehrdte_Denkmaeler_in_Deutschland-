/* Child map: runs inside the existing qgis2web iframe. */
(function () {
  'use strict';
  var CHANNEL = 'DENKMAL_MAP_V1';
  var leafletMap = window.map;
  var records = new Map();
  var selected = null;
  var focusGeneration = 0;

  function targetOrigin() { return location.protocol === 'file:' ? '*' : location.origin; }
  function send(type, payload) {
    if (window.parent === window) return;
    window.parent.postMessage(Object.assign({ channel: CHANNEL, type: type }, payload || {}), targetOrigin());
  }
  function announceReady() {
    if (window.DENKMAL_MAP_TOOLS_READY === false) return;
    if (!leafletMap || typeof leafletMap.eachLayer !== 'function') {
      send('ERROR', { message: 'Die Leaflet-Karte wurde nicht geladen.' });
      return;
    }
    var previous = records;
    records = new Map();
    window.layer_Gefhrdung_3.eachLayer(function (layer) {
      if (!layer.feature || !layer.feature.properties || typeof layer.getLatLng !== 'function') return;
      var props = layer.feature.properties;
      var id = Number(props.id != null ? props.id : props.fid);
      if (!Number.isInteger(id)) return;
      records.set(id, {
        layer: layer,
        baseStyle: previous.has(id) ? previous.get(id).baseStyle : {
          radius: typeof layer.getRadius === 'function' ? layer.getRadius() : undefined,
          color: layer.options.color,
          weight: layer.options.weight
        }
      });
    });
    send('READY', { ids: Array.from(records.keys()), sites: Array.from(records.values()).map(function(r){return Object.assign({},r.layer.feature.properties,{id:Number(r.layer.feature.properties.id != null ? r.layer.feature.properties.id : r.layer.feature.properties.fid)});}) });
  }
  function clearSelection(reason) {
    focusGeneration += 1;
    leafletMap.stop();
    if (selected !== null && records.has(selected)) {
      var previous = records.get(selected);
      if (typeof previous.layer.setStyle === 'function') previous.layer.setStyle(previous.baseStyle);
    }
    selected = null;
    send('SELECTION_CLEARED', { reason: reason });
  }
  function highlight(id) {
    if (selected !== null && selected !== id && records.has(selected)) {
      var previous = records.get(selected);
      if (typeof previous.layer.setStyle === 'function') previous.layer.setStyle(previous.baseStyle);
    }
    var current = records.get(id);
    if (current && typeof current.layer.setStyle === 'function') {
      current.layer.setStyle({ color: '#0f172a', weight: 3, radius: 10 });
      if (typeof current.layer.bringToFront === 'function') current.layer.bringToFront();
    }
    selected = id;
  }
  function focusSite(id) {
    var record = records.get(id);
    if (!record) {
      send('ERROR', { message: 'Das ausgewählte Denkmal ist in dieser Karte nicht vorhanden.' });
      return;
    }
    if (!leafletMap.hasLayer(window.layer_Gefhrdung_3)) window.layer_Gefhrdung_3.addTo(leafletMap);
    var layer = record.layer;
    if (!layer.getPopup || !layer.getPopup()) {
      send('ERROR', { message: 'Für dieses Denkmal ist kein Popup eingerichtet.' });
      return;
    }
    var generation = ++focusGeneration;
    leafletMap.stop();
    var latLng = layer.getLatLng();
    function openTarget() {
      if (generation !== focusGeneration) return;
      highlight(id);
      layer.openPopup();
      send('SITE_SELECTED', { id: id });
    }
    if (leafletMap.getZoom() === 11 && leafletMap.getCenter().equals(latLng, 0.0000001)) {
      openTarget();
      return;
    }
    leafletMap.once('moveend', openTarget);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      leafletMap.setView(latLng, 11, { animate: false });
    } else {
      leafletMap.flyTo(latLng, 11, { animate: true, duration: 0.6 });
    }
  }

  window.addEventListener('message', function (event) {
    if (event.source !== window.parent) return;
    if (location.protocol !== 'file:' && event.origin !== location.origin) return;
    var message = event.data;
    if (!message || typeof message !== 'object' || message.channel !== CHANNEL) return;
    if (message.type === 'HELLO') announceReady();
    else if (message.type === 'FOCUS_SITE') {
      var id = Number(message.id);
      if (Number.isInteger(id)) focusSite(id);
    }
  });
  window.addEventListener('denkmals:tools-ready', announceReady);
  window.addEventListener('denkmals:clear-selection', function (event) {
    clearSelection(event.detail ? event.detail.reason : 'overview');
  });
  if (leafletMap && typeof leafletMap.on === 'function') {
    leafletMap.on('popupopen', function (event) {
      var source = event.popup && event.popup._source;
      var properties = source && source.feature && source.feature.properties;
      if (!properties) return;
      var id = Number(properties.id != null ? properties.id : properties.fid);
      if (!records.has(id)) return;
      highlight(id);
      send('SITE_SELECTED', { id: id });
    });
    leafletMap.whenReady(announceReady);
  } else {
    send('ERROR', { message: 'Die Leaflet-Karte wurde nicht geladen. Bitte alle Projektdateien zusammen öffnen.' });
  }
})();
