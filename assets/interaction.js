/* Parent page: no direct iframe.contentWindow.map access. */
(function () {
  'use strict';
  var CHANNEL = 'DENKMAL_MAP_V1';
  var frame = document.getElementById('map-frame');
  var status = document.getElementById('map-status');
  var cards = Array.from(document.querySelectorAll('.card-item[data-site-id]'));
  var buttons = Array.from(document.querySelectorAll('.btn-focus'));
  var cardById = new Map(cards.map(function (card) {
    return [Number(card.dataset.siteId), card];
  }));
  var ready = false;
  var knownIds = new Set();
  var queuedId = null;
  var attempts = 0;
  var handshakeTimer;

  function statusText(text, error) {
    status.textContent = text;
    status.classList.toggle('is-error', Boolean(error));
  }
  function targetOrigin() {
    return location.protocol === 'file:' ? '*' : location.origin;
  }
  function send(type, payload) {
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage(Object.assign({ channel: CHANNEL, type: type }, payload || {}), targetOrigin());
  }
  function highlight(id, scroll) {
    cards.forEach(function (card) {
      var active = Number(card.dataset.siteId) === id;
      card.classList.toggle('is-active', active);
      card.querySelector('.btn-focus').setAttribute('aria-pressed', String(active));
    });
    var card = cardById.get(id);
    if (card && scroll) {
      card.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }
  function hello() {
    if (ready) return;
    attempts += 1;
    send('HELLO');
    if (attempts >= 45) {
      clearInterval(handshakeTimer);
      statusText('Karte nicht verbunden. Bitte den gesamten entpackten Ordner öffnen, nicht nur index.html.', true);
    }
  }

  window.selectSite = function (value) {
    var id = Number(value);
    if (!Number.isInteger(id) || !cardById.has(id)) return;
    if (!ready) {
      queuedId = id;
      send('HELLO');
      statusText('Karte wird geladen …');
      return;
    }
    if (!knownIds.has(id)) {
      statusText('Dieser Fall wurde in der eingebundenen Karte nicht gefunden.', true);
      return;
    }
    var name = cardById.get(id).querySelector('h3').textContent;
    statusText(name + ' wird auf der Karte angezeigt …');
    send('FOCUS_SITE', { id: id });
  };

  window.addEventListener('message', function (event) {
    if (!frame || event.source !== frame.contentWindow) return;
    if (location.protocol !== 'file:' && event.origin !== location.origin) return;
    var message = event.data;
    if (!message || typeof message !== 'object' || message.channel !== CHANNEL) return;
    if (message.type === 'READY' && Array.isArray(message.ids)) {
      ready = true;
      clearInterval(handshakeTimer);
      knownIds = new Set(message.ids.filter(Number.isInteger));
      buttons.forEach(function (button) {
        var id = Number(button.closest('.card-item').dataset.siteId);
        button.disabled = !knownIds.has(id);
      });
      var connected = cards.filter(function (card) { return knownIds.has(Number(card.dataset.siteId)); }).length;
      statusText('Karte bereit · ' + connected + ' Fälle verbunden');
      if (queuedId !== null) {
        var next = queuedId;
        queuedId = null;
        window.selectSite(next);
      }
    } else if (message.type === 'SITE_SELECTED') {
      var id = Number(message.id);
      if (!cardById.has(id)) return;
      highlight(id, true);
      statusText(cardById.get(id).querySelector('h3').textContent + ' · ausgewählt');
    } else if (message.type === 'ERROR') {
      statusText(typeof message.message === 'string' ? message.message : 'Die Kartenaktion konnte nicht ausgeführt werden.', true);
    }
  });

  buttons.forEach(function (button) {
    button.disabled = true;
    button.setAttribute('aria-pressed', 'false');
  });
  document.querySelector('.cards-list').addEventListener('click', function (event) {
    if (event.target.closest('button, a')) return;
    var card = event.target.closest('.card-item[data-site-id]');
    if (card && ready) window.selectSite(card.dataset.siteId);
  });
  frame.addEventListener('load', function () {
    ready = false;
    knownIds.clear();
    attempts = 0;
    buttons.forEach(function (button) { button.disabled = true; });
    clearInterval(handshakeTimer);
    statusText('Karte wird verbunden …');
    hello();
    handshakeTimer = setInterval(hello, 350);
  });
  hello();
  handshakeTimer = setInterval(hello, 350);
})();
