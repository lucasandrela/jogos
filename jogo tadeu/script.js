const phases = [
  {
    title: 'Pegadas ao meio-dia', challenge: 'Encontre metade das pegadas',
    question: 'Qual trilha mostra 1/2 de 8 pegadas?', clue: '1/2 × 8', storm: 18,
    speech: 'Olhe bem. A poeira logo vai cobrir tudo.',
    options: ['3 pegadas', '4 pegadas', '6 pegadas'], correct: 1,
    explain: 'Metade de 8 é 4, pois 8 dividido em duas partes iguais dá 4.'
  },
  {
    title: 'Sombras do mandacaru', challenge: 'Reconheça frações equivalentes',
    question: 'Qual fração ocupa o mesmo espaço que 1/2?', clue: '1/2 = ?', storm: 30,
    speech: 'Os números mudam, mas o tamanho pode continuar igual.',
    options: ['2/4', '2/3', '3/4'], correct: 0,
    explain: '2/4 equivale a 1/2: ao simplificar 2/4 por 2, encontramos 1/2.'
  },
  {
    title: 'A curva das pedras', challenge: 'Junte as partes do caminho',
    question: 'Qual é o resultado de 1/4 + 2/4?', clue: '1/4 + 2/4', storm: 43,
    speech: 'Some as partes iguais e guarde a resposta na memória.',
    options: ['2/8', '3/4', '3/8'], correct: 1,
    explain: 'Com denominadores iguais, somamos os numeradores: 1/4 + 2/4 = 3/4.'
  },
  {
    title: 'Trilha quase invisível', challenge: 'Siga a ordem crescente',
    question: 'Qual trilha vai da menor para a maior fração?', clue: 'MENOR → MAIOR', storm: 57,
    speech: 'Quando a vista falha, compare uma parte de cada vez.',
    options: ['1/4 • 1/2 • 3/4', '1/2 • 1/4 • 3/4', '3/4 • 1/2 • 1/4'], correct: 0,
    explain: 'A ordem correta é 1/4, 1/2 e 3/4: um quarto, dois quartos e três quartos.'
  },
  {
    title: 'O último vendaval', challenge: 'Complete um caminho inteiro',
    question: 'Qual soma forma exatamente 1 inteiro?', clue: 'SOMA = 1', storm: 72,
    speech: 'É o último rastro. Confie no que você aprendeu!',
    options: ['1/2 + 1/4', '1/4 + 1/4', '1/2 + 1/4 + 1/4'], correct: 2,
    explain: '1/2 vale 2/4. Então 2/4 + 1/4 + 1/4 = 4/4, ou 1 inteiro.'
  }
];

const freshState = () => ({
  phase: 0, lives: 3, score: 0, combo: 0, bestCombo: 0,
  attempts: 0, correct: 0, selected: null, focus: 2,
  observing: false, locked: false, revealTimer: null, countTimer: null
});

let state = freshState();
let modalAction = null;
const el = id => document.getElementById(id);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  el(id).classList.add('active');
}

function startGame() {
  GameSession.cancel(); hideModal();
  clearTimers();
  state = freshState();
  showScreen('play');
  loadPhase(0);
}

function goHome() {
  GameSession.cancel();
  clearTimers();
  hideModal();
  showScreen('intro');
}

function loadPhase(index) {
  clearTimers();
  state.phase = index;
  state.lives = 3;
  state.selected = null;
  state.focus = 2;
  state.locked = false;
  const phase = phases[index];

  el('phase-count').textContent = `TRECHO ${index + 1} DE ${phases.length}`;
  el('phase-title').textContent = phase.title;
  el('challenge-title').textContent = phase.challenge;
  el('challenge-question').textContent = phase.question;
  el('clue').textContent = phase.clue;
  el('tadeu-line').textContent = phase.speech;
  el('storm-number').textContent = `${phase.storm}%`;
  el('storm-fill').style.width = `${phase.storm}%`;
  el('selection-text').textContent = 'Observe as pistas...';
  el('confirm-btn').disabled = true;
  renderHud();
  renderOptions();
  beginObservation();
}

function renderHud() {
  GameHearts.render(el('hearts'), state.lives);
  el('score').textContent = state.score;
  el('combo').textContent = `${state.combo}x`;
  el('focus-count').textContent = GamePrefs.practice ? '∞' : state.focus;
}

function renderOptions() {
  const box = el('options');
  box.innerHTML = '';
  phases[state.phase].options.forEach((answer, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `trail-card${state.selected === index ? ' selected' : ''}`;
    button.dataset.index = index;
    button.setAttribute('aria-label', `Trilha ${String.fromCharCode(65 + index)}: ${answer}`);
    button.innerHTML = `<span class="route-name">TRILHA ${String.fromCharCode(65 + index)}</span><span class="tracks">⌁ ⌁ ⌁ ⌁</span><strong class="answer">${answer}</strong>`;
    button.addEventListener('click', () => selectOption(index));
    box.appendChild(button);
  });
}

function beginObservation(duration = 8000) {
  clearTimers();
  state.observing = !GamePrefs.practice;
  state.locked = !GamePrefs.practice;
  setCovered(false);
  document.querySelectorAll('.trail-card').forEach(card => card.disabled = state.locked);
  el('focus-btn').disabled = GamePrefs.practice || state.locked;
  el('confirm-btn').disabled = true;
  el('memory-banner').classList.remove('fade');
  el('memory-banner').querySelector('b').textContent = GamePrefs.practice ? 'NO SEU RITMO' : 'OBSERVE!';
  el('memory-count').textContent = GamePrefs.practice ? '∞' : Math.ceil(duration / 1000);
  el('instruction').textContent = GamePrefs.practice ? 'Leia, compare e escolha uma trilha.' : 'Memorize as opções. As pistas somem ao final da contagem.';
  el('selection-text').textContent = 'Qual trilha responde ao desafio?';
  if (GamePrefs.practice) return;
  let remaining = Math.ceil(duration / 1000);
  function tick() {
    remaining--;
    el('memory-count').textContent = remaining;
    if (remaining > 0) { state.revealTimer = GameSession.after(tick, 1000); return; }
    state.revealTimer = null;
    state.observing = false;
    state.locked = false;
    setCovered(true);
    document.querySelectorAll('.trail-card').forEach(card => card.disabled = false);
    el('focus-btn').disabled = state.focus <= 0;
    el('memory-banner').classList.add('fade');
    el('instruction').textContent = 'Escolha a trilha de memória. Use o foco para rever.';
    el('confirm-btn').disabled = state.selected === null;
  }
  state.revealTimer = GameSession.after(tick, 1000);
}

function setCovered(covered) {
  document.querySelectorAll('.trail-card').forEach(card => {
    card.classList.toggle('covered', covered);
    card.querySelector('.answer').setAttribute('aria-hidden', String(covered));
    card.setAttribute('aria-label', 'Trilha '+String.fromCharCode(65+Number(card.dataset.index))+(covered ? ', pista oculta' : ': '+phases[state.phase].options[card.dataset.index]));
    card.classList.remove('reveal');
  });
}

function selectOption(index) {
  if (state.locked) return;
  state.selected = index;
  document.querySelectorAll('.trail-card').forEach((card, i) => {
    card.classList.toggle('selected', i === index);
  });
  el('selection-text').textContent = `Trilha ${String.fromCharCode(65 + index)} escolhida.`;
  el('confirm-btn').disabled = false;
}

function useFocus() {
  if (state.focus <= 0 || state.locked) return;
  state.focus -= 1;
  // Rever a pista não retira pontos.
  renderHud();
  beginObservation(8000);
}

function confirmChoice() {
  if (state.selected === null || state.locked) return;
  const phase = phases[state.phase];
  state.attempts += 1;
  state.locked = true;
  setCovered(false);
  document.querySelectorAll('.trail-card').forEach((card, index) => {
    card.disabled = true;
    card.classList.add('reveal');
    if (index === phase.correct) card.classList.add('correct');
  });

  if (state.selected === phase.correct) {
    state.correct += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.score += 100 + (state.combo - 1) * 25 + state.lives * 10;
    renderHud();
    GameSession.after(() => showFeedback(true, phase), 480);
  } else {
    state.lives -= 1;
    state.combo = 0;
    renderHud();
    GameSession.after(() => showFeedback(false, phase), 480);
  }
}

function showFeedback(success, phase) {
  const card = el('modal-card');
  card.className = success ? 'success' : 'error';
  el('modal-icon').textContent = success ? '✓' : '!';
  el('modal-label').textContent = success ? 'RASTRO ENCONTRADO' : 'A POEIRA CONFUNDIU O RASTRO';
  el('modal-title').textContent = success ? (GamePrefs.practice ? 'Boa escolha!' : 'Boa memória!') : (state.lives ? 'Caminho errado!' : 'A ventania venceu desta vez');
  el('modal-text').textContent = success
    ? `${phase.explain}\nTadeu avançou mais um trecho.`
    : state.lives
      ? `A resposta correta era “${phase.options[phase.correct]}”.\n${phase.explain}`
      : `A resposta correta era “${phase.options[phase.correct]}”. Recomece este trecho e observe com calma.`;
  el('modal-btn').textContent = success
    ? (state.phase === phases.length - 1 ? 'VER RESULTADO' : 'PRÓXIMO TRECHO')
    : (state.lives ? 'OBSERVAR NOVAMENTE' : 'RECOMEÇAR TRECHO');

  modalAction = success
    ? () => state.phase === phases.length - 1 ? finishGame() : loadPhase(state.phase + 1)
    : () => {
        if (!state.lives) {
          state.lives = 3;
          state.focus = 2;
        }
        state.selected = null;
        state.locked = false;
        renderHud();
        renderOptions();
        el('confirm-btn').disabled = true;
        beginObservation();
      };
  el('modal').classList.remove('hidden');
  el('modal-btn').focus();
}

function hideModal() {
  el('modal').classList.add('hidden');
}

function handleModal() {
  hideModal();
  if (modalAction) modalAction();
  modalAction = null;
}

function finishGame() {
  clearTimers();
  const accuracy = state.attempts ? Math.round(state.correct / state.attempts * 100) : 0;
  el('accuracy').textContent = `${accuracy}%`;
  el('safe-trails').textContent = state.correct;
  el('best-combo').textContent = `${state.bestCombo}x`;
  const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;
  el('stars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  showScreen('result');
}

function clearTimers() {
  if (state.revealTimer) GameSession.cancel();
  if (state.countTimer) clearInterval(state.countTimer);
  state.revealTimer = null;
  state.countTimer = null;
}

function makeDust() {
  const box = el('sand-particles');
  for (let i = 0; i < 36; i += 1) {
    const speck = document.createElement('i');
    speck.style.top = `${Math.random() * 100}%`;
    speck.style.left = `${-10 - Math.random() * 30}%`;
    speck.style.animationDuration = `${2.2 + Math.random() * 4}s`;
    speck.style.animationDelay = `${-Math.random() * 5}s`;
    speck.style.transform = `scale(${0.5 + Math.random() * 1.8})`;
    box.appendChild(speck);
  }
}

function cleanTadeuBackground() { document.querySelectorAll('.tadeu-img').forEach(image => image.classList.add('ready')); }

el('start-btn').addEventListener('click', startGame);
el('home-btn').addEventListener('click', goHome);
el('focus-btn').addEventListener('click', useFocus);
el('confirm-btn').addEventListener('click', confirmChoice);
el('modal-btn').addEventListener('click', handleModal);
el('restart-btn').addEventListener('click', startGame);
el('continue-btn').addEventListener('click', () => location.href = '../index.html');
window.addEventListener('keydown', event => {
  if (!GamePrefs.paused && event.key === 'Escape' && el('play').classList.contains('active')) goHome();
});
cleanTadeuBackground();
makeDust();

window.getGameHint = () => ['Divida 8 em dois grupos iguais.', 'Simplifique cada alternativa dividindo os dois números pelo mesmo valor.', 'Some os numeradores e mantenha o denominador.', 'Escreva todas as frações em quartos para comparar.', 'Troque 1/2 por 2/4 e some os quartos.'][state.phase];
