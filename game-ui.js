(() => {
  'use strict';

  const title = document.title.toLowerCase();
  const configs = {
    bento: {
      match: 'barragem', slug: 'bento', name: 'Barragem das Frações', chapter: 'Capítulo 01 · Bento',
      goal: 'Monte cada camada da barragem com frações que formem exatamente o valor pedido.',
      steps: ['Escolha os troncos para formar o alvo.', 'Confira sua soma.', 'Toque em Soltar. No modo Desafio, espere a mira verde.'],
      tips: ['Duas metades formam 1 inteiro.', 'Compare a sua soma com o alvo antes de conferir.', 'Na mira, espere o marcador entrar na faixa verde.']
    },
    clarice: {
      match: 'pirâmide', slug: 'clarice', name: 'Enigma da Pirâmide', chapter: 'Capítulo 02 · Clarice',
      goal: 'Resolva os enigmas de frações para escolher placas seguras e atravessar as câmaras.',
      steps: ['Leia o enigma e observe a pista.', 'Calcule pensando no todo.', 'Escolha uma placa e teste a passagem.'],
      tips: ['Metade significa dividir o total em 2 partes iguais.', 'Use a pista destacada antes de escolher.', 'Se errar, leia a explicação: ela ajuda na próxima tentativa.']
    },
    martim: {
      match: 'despensa', slug: 'martim', name: 'Despensa de Martim', chapter: 'Capítulo 03 · Martim',
      goal: 'Divida as provisões em porções iguais para organizar a despensa.',
      steps: ['Toque em Inverter divisor.', 'Use as setas para regular o resultado.', 'Acione a máquina e confira as porções.'],
      tips: ['Dividir por uma fração é multiplicar pelo inverso.', 'Inverter 1/2 transforma a fração em 2/1.', 'Pense: quantas porções cabem no estoque?']
    },
    silas: {
      match: 'fractionquest', slug: 'silas', name: 'Aventura de Silas', chapter: 'Capítulo 04 · Silas',
      goal: 'Combine peças de frações para preencher o túnel até o alvo indicado.',
      steps: ['Escolha uma peça da mochila.', 'Toque em um espaço vazio do túnel.', 'Quando chegar ao alvo, toque em Cavar.'],
      tips: ['Olhe o alvo e complete somente o que falta.', 'Você pode tocar no × para retirar uma peça.', 'A barra mostra quanto do túnel já foi preenchido.']
    },
    tadeu: {
      match: 'rastro', slug: 'tadeu', name: 'Trilha de Tadeu', chapter: 'Capítulo 05 · Tadeu',
      goal: 'Resolva o desafio e escolha a trilha correta. No modo Desafio, memorize as opções antes da ventania.',
      steps: ['Leia a pergunta e compare as trilhas.', 'No modo Desafio, observe por 8 segundos.', 'Escolha a trilha e confirme.'],
      tips: ['Repita a pista em voz baixa para lembrar.', 'Use o foco quando precisar observar novamente.', 'Compare todas as opções antes de confirmar.']
    }
  };

  const config = Object.values(configs).find(item => title.includes(item.match)) || configs.silas;
  const soundKey = 'amigosDoSilas.sound';
  let soundOn = GameStore.getItem(soundKey) !== 'off';
  let tipIndex = 0;
  let audioContext;
  let toastTimer;

  window.__kidsSoundOn = soundOn;
  document.body.classList.add('game-polished');
  document.body.dataset.game = config.slug;

  function syncScreenState() {
    const active = document.querySelector('.screen.active, [id^="screen-"][class*="active"]');
    const id = (active?.id || '').toLowerCase();
    const classes = (active?.className || '').toString().toLowerCase();
    const signature = `${id} ${classes}`;
    if (/result|final|complete|ending/.test(signature)) document.body.dataset.screen = 'result';
    else if (/intro|title|start|welcome/.test(signature) || !active) document.body.dataset.screen = 'intro';
    else document.body.dataset.screen = 'play';
  }

  function tone(kind = 'tap') {
    if (!soundOn || config.slug === 'silas' || config.slug === 'martim') return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;
      const notes = kind === 'success' ? [523, 659, 784] : kind === 'error' ? [210, 155] : [430];
      notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = kind === 'error' ? 'sawtooth' : 'triangle';
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        const start = now + index * .09;
        gain.gain.setValueAtTime(kind === 'tap' ? .035 : .07, start);
        gain.gain.exponentialRampToValueAtTime(.001, start + .16);
        oscillator.start(start);
        oscillator.stop(start + .17);
      });
    } catch (_) { /* O jogo continua normalmente sem áudio. */ }
  }

  function createGuide() {
    const dialog = document.createElement('dialog');
    dialog.className = 'kids-guide-dialog';
    dialog.setAttribute('aria-labelledby', 'kids-guide-title');
    const card = document.createElement('article');
    card.className = 'kids-guide-card';
    const kicker = document.createElement('p');
    kicker.className = 'kids-guide-kicker';
    kicker.textContent = 'Como jogar';
    const heading = document.createElement('h2');
    heading.id = 'kids-guide-title';
    heading.textContent = config.name;
    const goal = document.createElement('p');
    goal.className = 'kids-guide-goal';
    goal.textContent = config.goal;
    const list = document.createElement('ol');
    list.className = 'kids-guide-steps';
    config.steps.forEach(step => {
      const item = document.createElement('li');
      item.textContent = step;
      list.appendChild(item);
    });
    const tip = document.createElement('p');
    tip.className = 'kids-guide-tip';
    tip.textContent = `💡 ${config.tips[0]}`;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'kids-guide-close';
    close.textContent = 'ENTENDI, VAMOS JOGAR!';
    close.addEventListener('click', () => dialog.close());
    card.append(kicker, heading, goal, list, tip, close);
    dialog.appendChild(card);
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
    document.body.appendChild(dialog);
    return dialog;
  }

  function showToast(message) {
    let toast = document.querySelector('.kids-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'kids-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 4500);
  }

  function celebrate() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const layer = document.createElement('div');
    layer.className = 'kids-confetti';
    const colors = ['#ffd45c', '#ef6f61', '#4eb8ad', '#705dc5', '#55a8e8'];
    for (let index = 0; index < 44; index += 1) {
      const piece = document.createElement('i');
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[index % colors.length];
      piece.style.setProperty('--drift', `${-90 + Math.random() * 180}px`);
      piece.style.setProperty('--spin', `${360 + Math.random() * 900}deg`);
      piece.style.setProperty('--fall-time', `${1.4 + Math.random() * 1.2}s`);
      piece.style.animationDelay = `${Math.random() * .25}s`;
      layer.appendChild(piece);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 3000);
  }

  const brand = document.createElement('a');
  brand.className = 'saga-brand';
  brand.href = '../index.html';
  brand.setAttribute('aria-label', 'Voltar para todos os jogos dos Amigos do Silas');
  brand.innerHTML = `<span class="saga-brand__mark" aria-hidden="true">S</span><span class="saga-brand__copy"><strong>AMIGOS DO SILAS</strong><small>${config.chapter}</small></span>`;
  document.body.appendChild(brand);

  const guide = createGuide();
  const toolbar = document.createElement('nav');
  toolbar.className = 'kids-toolbar';
  toolbar.setAttribute('aria-label', 'Ajuda do jogo');
  const toolData = [
    ['games', '⌂', 'Ver todos os jogos', 'Jogos'],
    ['guide', '?', 'Como jogar', 'Regras'],
    ['hint', '✦', 'Mostrar uma dica', 'Dica'],
    ['sound', soundOn ? '♪' : '∕', soundOn ? 'Desligar sons' : 'Ligar sons', 'Som']
  ];
  toolData.forEach(([action, icon, label, shortLabel]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'kids-tool';
    button.dataset.action = action;
    const iconElement = document.createElement('span');
    iconElement.className = 'kids-tool__icon';
    iconElement.setAttribute('aria-hidden', 'true');
    iconElement.textContent = icon;
    const labelElement = document.createElement('span');
    labelElement.className = 'kids-tool__label';
    labelElement.textContent = shortLabel;
    button.append(iconElement, labelElement);
    button.title = label;
    button.setAttribute('aria-label', label);
    if (action === 'sound') button.setAttribute('aria-pressed', String(soundOn));
    toolbar.appendChild(button);
  });
  document.body.appendChild(toolbar);

  toolbar.addEventListener('click', event => {
    const button = event.target.closest('.kids-tool');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'games') location.href = '../index.html';
    if (action === 'guide') { tone('tap'); guide.showModal(); }
    if (action === 'hint') {
      tone('tap');
      showToast(window.getGameHint?.() || config.tips[tipIndex % config.tips.length]);
      tipIndex += 1;
      const challenge = document.querySelector('.screen.active .challenge, .screen.active .mascot-dialog, .screen.active .phase-objective');
      if (challenge) {
        challenge.classList.remove('kids-pop');
        requestAnimationFrame(() => challenge.classList.add('kids-pop'));
      }
    }
    if (action === 'sound') {
      soundOn = !soundOn;
      window.__kidsSoundOn = soundOn;
      GameStore.setItem(soundKey, soundOn ? 'on' : 'off');
      button.querySelector('.kids-tool__icon').textContent = soundOn ? '♪' : '∕';
      button.setAttribute('aria-pressed', String(soundOn));
      button.setAttribute('aria-label', soundOn ? 'Desligar sons' : 'Ligar sons');
      button.title = soundOn ? 'Desligar sons' : 'Ligar sons';
      tone('tap');
      showToast(soundOn ? 'Sons ligados.' : 'Sons desligados.');
    }
  });

  document.addEventListener('keydown', event => {
    if (event.target.matches('input, textarea, select') || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if ((key === '?' || key === 'h') && !document.querySelector('.modal:not(.hidden), .overlay.show')) {
      event.preventDefault();
      guide.showModal();
      tone('tap');
    }
    if (key === 'm') {
      event.preventDefault();
      toolbar.querySelector('[data-action="sound"]').click();
    }
    if (event.key === 'Escape' && guide.open) guide.close();
  });

  const start = document.querySelector('#start-btn, .btn-start, [onclick*="goToMap"]');
  if (start) {
    const note = document.createElement('p');
    note.className = 'kids-start-note';
    note.textContent = 'Tentativas livres • dicas sem perder pontos';
    start.insertAdjacentElement('afterend', note);
    start.addEventListener('click', () => {
      GameStore.setItem(`amigosDoSilas.${config.slug}.started`, 'true');
      tone('tap');
    });
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button && !button.closest('.kids-toolbar') && !button.classList.contains('kids-guide-close')) tone('tap');
  });

  let recordedResult = false;
  let lastSuccess = false;
  let lastError = false;
  const observer = new MutationObserver(() => {
    syncScreenState();
    const success = Boolean(document.querySelector('.modal:not(.hidden) .success, .overlay.show .success-card, .screen.active.result, #screen-result.active'));
    const resultScreen = document.querySelector('.screen.active.result, #screen-result.active');
    if (!resultScreen) recordedResult = false;
    if (resultScreen && !recordedResult) {
      recordedResult = true;
      GameStore.setItem(`amigosDoSilas.${config.slug}.completed`, 'true');
      const stars = (document.getElementById('stars')?.textContent.match(/★/g) || []).length;
      const best = Number(GameStore.getItem(`amigosDoSilas.${config.slug}.stars`)) || 0;
      if (stars > best) GameStore.setItem(`amigosDoSilas.${config.slug}.stars`, stars);
    }
    const error = Boolean(document.querySelector('.modal:not(.hidden) .error, #overlay-fail.show, #overlay-timeout.show'));
    if (success && !lastSuccess) {
      tone('success');
      celebrate();
      const active = document.querySelector('.modal:not(.hidden) article, .overlay.show .overlay-card, .screen.active .result-card, #screen-result.active .result-card');
      if (active) active.classList.add('kids-pop');
      if (document.querySelector('.screen.active.result, #screen-result.active')) {
        GameStore.setItem(`amigosDoSilas.${config.slug}.completed`, 'true');
      }
    }
    if (error && !lastError) {
      tone('error');
      const active = document.querySelector('.modal:not(.hidden) article, #overlay-fail.show .overlay-card, #overlay-timeout.show .overlay-card');
      if (active) active.classList.add('kids-wiggle');
    }
    lastSuccess = success;
    lastError = error;
  });
  observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
  syncScreenState();

  // Practice is the default. Only games with timed mechanics need this choice.
  if (['bento', 'tadeu'].includes(config.slug) && start) {
    const modes = document.createElement('fieldset');
    modes.className = 'play-modes';
    modes.innerHTML = `<legend>Escolha seu ritmo</legend><label><input type="radio" name="play-mode" value="practice"><span><b>Praticar</b><small>${config.slug === 'bento' ? 'Sem tempo e sem mira' : 'Pistas sempre visíveis'}</small></span></label><label><input type="radio" name="play-mode" value="challenge"><span><b>Desafio</b><small>${config.slug === 'bento' ? 'Correnteza e mira' : 'Memorize em 8 segundos'}</small></span></label>`;
    modes.querySelector(`[value="${GamePrefs.practice ? 'practice' : 'challenge'}"]`).checked = true;
    modes.addEventListener('change', event => GamePrefs.setMode(event.target.value));
    start.insertAdjacentElement('beforebegin', modes);
  }

  // Feedback dialogs trap keyboard focus; Esc cannot silently discard feedback.
  document.addEventListener('keydown', event => {
    const modal = document.querySelector('.screen.active .modal:not(.hidden), .overlay.show');
    if (!modal || document.querySelector('dialog[open]')) return;
    if (event.key === 'Tab') {
      const focusable = [...modal.querySelectorAll('button:not(:disabled), a[href], [tabindex="0"]')];
      const first = focusable[0], last = focusable.at(-1);
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
  });

  // Number shortcuts complement touch and the native Tab/Enter controls.
  document.addEventListener('keydown', event => {
    if (event.target.closest('input, select, textarea') || event.ctrlKey || event.altKey || event.metaKey || GamePrefs.paused || document.querySelector('.modal:not(.hidden), .overlay.show')) return;
    const index = Number(event.key) - 1;
    if (!Number.isInteger(index) || index < 0 || index > 8) return;
    const options = document.querySelectorAll('.screen.active #options button:not(:disabled), .screen.active .inv-piece:not(:disabled), .screen.active .quiz-opt-btn:not(:disabled)');
    if (options[index]) { event.preventDefault(); options[index].click(); }
  });
  window.GamePolish = { celebrate, showToast, tone, config };
})();
