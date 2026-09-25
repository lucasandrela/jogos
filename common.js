/* Shared preferences and cancellable round timers. No network dependency. */
(() => {
  'use strict';
  const memory = new Map();
  window.GameStore = {
    getItem(key) { try { return localStorage.getItem(key) ?? memory.get(key) ?? null; } catch (_) { return memory.get(key) ?? null; } },
    setItem(key, value) { memory.set(key, String(value)); try { localStorage.setItem(key, String(value)); } catch (_) {} },
    removeItem(key) { memory.delete(key); try { localStorage.removeItem(key); } catch (_) {} }
  };
  window.GamePrefs = {
    get practice() { return GameStore.getItem('amigosDoSilas.mode') !== 'challenge'; },
    setMode(mode) { GameStore.setItem('amigosDoSilas.mode', mode); },
    get paused() { return document.hidden || !!document.querySelector('dialog[open]'); }
  };
  const commonUrl = document.currentScript?.src || location.href;
  const heartUrl = new URL('assets/ui/heart-pixel.svg', commonUrl).href;
  window.GameHearts = {
    render(target, lives, total = 3) {
      if (!target) return;
      const remaining = Math.max(0, Math.min(total, Number(lives) || 0));
      target.replaceChildren();
      target.classList.add('pixel-hearts');
      for (let index = 0; index < total; index++) {
        const heart = document.createElement('img');
        heart.src = heartUrl;
        heart.alt = '';
        heart.className = `pixel-heart ${index < remaining ? 'is-full' : 'is-empty'}`;
        heart.setAttribute('aria-hidden', 'true');
        target.appendChild(heart);
      }
      target.setAttribute('aria-label', `${remaining} ${remaining === 1 ? 'vida' : 'vidas'}`);
    }
  };
  const pending = new Set();
  window.GameSession = {
    after(callback, delay) {
      const token = {remaining: delay, previous: performance.now(), id: null};
      function tick() {
        const now = performance.now();
        if (!GamePrefs.paused) token.remaining -= Math.min(now - token.previous, 100);
        token.previous = now;
        if (token.remaining <= 0) { pending.delete(token); callback(); }
        else token.id = setTimeout(tick, 40);
      }
      pending.add(token); token.id = setTimeout(tick, 40); return token;
    },
    cancel() { pending.forEach(token => clearTimeout(token.id)); pending.clear(); }
  };
})();
