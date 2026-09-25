const phases = [
  {
    title: 'O Depósito de Raízes', challenge: 'Separe as raízes',
    question: 'Há 1 cesta de raízes. Cada pote recebe 1/2 cesta. Quantos potes serão preenchidos?',
    operation: '1 ÷ 1/2', dividend: '1', divisor: '1/2', inverse: '2/1',
    options: ['1 pote', '2 potes', '3 potes'], results: ['1', '2', '3'], unit: 'potes', answer: 1, jars: 2, food: '🥕',
    speech: 'Cada pote recebe meia cesta. Quantos potes conseguimos encher?',
    explanation: '1 ÷ 1/2 = 1 × 2/1 = 2. Duas metades formam uma cesta inteira.'
  },
  {
    title: 'A Prateleira dos Cogumelos', challenge: 'Monte porções iguais',
    question: 'Martim tem 3/4 de uma cesta de cogumelos. Quantas porções de 1/4 cabem nela?',
    operation: '3/4 ÷ 1/4', dividend: '3/4', divisor: '1/4', inverse: '4/1',
    options: ['2 porções', '3 porções', '4 porções'], results: ['2', '3', '4'], unit: 'porções', answer: 1, jars: 3, food: '🍄',
    speech: 'Se cada porção vale um quarto, conte quantos quartos existem em três quartos.',
    explanation: '3/4 ÷ 1/4 = 3/4 × 4/1 = 3. Em 3/4 cabem exatamente três porções de 1/4.'
  },
  {
    title: 'O Cantinho das Amoras', challenge: 'Embale a colheita',
    question: 'Há 2/3 de uma cesta de amoras. Cada pacote leva 1/6 de cesta. Quantos pacotes podem ser feitos?',
    operation: '2/3 ÷ 1/6', dividend: '2/3', divisor: '1/6', inverse: '6/1',
    options: ['3 pacotes', '4 pacotes', '6 pacotes'], results: ['3', '4', '6'], unit: 'pacotes', answer: 1, jars: 4, food: '●',
    speech: 'Transforme os terços em sextos e as porções aparecerão.',
    explanation: '2/3 equivale a 4/6. Por isso, 2/3 ÷ 1/6 = 4 pacotes.'
  },
  {
    title: 'A Câmara das Nozes', challenge: 'Conte as porções e a parte que sobra',
    question: 'Um saco tem 5/6 da medida de nozes. Cada porção usa 1/3 da medida. Quantas porções cabem, incluindo a parte de uma porção?',
    operation: '5/6 ÷ 1/3', dividend: '5/6', divisor: '1/3', inverse: '3/1',
    options: ['1 1/2 porção', '2 porções', '2 1/2 porções'], results: ['1 1/2', '2', '2 1/2'], unit: 'porções', answer: 2, jars: 3, partial: true, food: '◆',
    speech: 'O resultado pode ter uma porção inteira e mais uma parte. Isso também vale!',
    explanation: '5/6 ÷ 1/3 = 5/6 × 3/1 = 15/6 = 5/2, ou 2 1/2 porções.'
  },
  {
    title: 'A Mesa dos Amigos', challenge: 'Prepare o lanche da turma',
    question: 'Silas, Bento e Clarice vão dividir igualmente 3/4 de um bolo. Que fração do bolo cada amigo receberá?',
    operation: '3/4 ÷ 3', dividend: '3/4', divisor: '3', inverse: '1/3',
    options: ['1/3 do bolo', '1/4 do bolo', '3/7 do bolo'], results: ['1/3', '1/4', '3/7'], unit: 'para cada amigo', answer: 1, jars: 3, food: '▰',
    speech: 'São três amigos e partes iguais. Qual será a porção de cada um?',
    explanation: '3/4 ÷ 3 = 3/4 × 1/3 = 3/12 = 1/4. Cada amigo recebe um quarto do bolo.'
  }
];

const state = {
  phase: 0, lives: 3, score: 0, rain: 8, selected: null, flipped: false,
  attempts: 0, correct: 0, combo: 0, bestCombo: 0, savedFood: 0,
  active: false, busy: false
};

const el = id => document.getElementById(id);
let modalAction = null;
let audioContext = null;

function playTone(kind) {
  if (window.__kidsSoundOn === false) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = kind === 'success' ? 'triangle' : kind === 'error' ? 'sawtooth' : 'sine';
    oscillator.frequency.setValueAtTime(kind === 'success' ? 520 : kind === 'error' ? 150 : 300, now);
    if (kind === 'success') oscillator.frequency.exponentialRampToValueAtTime(780, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.start(now); oscillator.stop(now + 0.23);
  } catch (_) { /* O jogo continua normalmente quando áudio não está disponível. */ }
}

function prepareCharacterArt() { document.querySelectorAll('.martim-img').forEach(image => image.classList.add('ready')); }

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.toggle('active', screen.id === id));
}

function startGame() {
  GameSession.cancel(); hideModal();
  Object.assign(state, {
    phase: 0, lives: 3, score: 0, rain: 8, selected: null, flipped: false,
    attempts: 0, correct: 0, combo: 0, bestCombo: 0, savedFood: 0,
    active: true, busy: false
  });
  renderScore(); renderLives(); renderRain(); showScreen('play'); loadPhase(0);
}

function goHome() {
  GameSession.cancel();
  state.active = false; state.busy = false; hideModal(); showScreen('intro');
}

function loadPhase(index) {
  state.phase = index; state.selected = null; state.flipped = false; state.busy = false;
  const phase = phases[index];
  el('phase-count').textContent = `GALERIA ${index + 1} DE ${phases.length}`;
  el('phase-title').textContent = phase.title;
  el('challenge-title').textContent = phase.challenge;
  el('challenge-question').textContent = phase.question;
  el('operation').textContent = phase.operation;
  el('martim-line').textContent = phase.speech;
  el('dividend').textContent = phase.dividend;
  el('divisor').textContent = phase.divisor;
  el('divisor-label').textContent = 'PORÇÃO';
  el('operator').textContent = '÷';
  el('divisor-card').className = 'math-card divisor-card';
  el('portion-machine').className = 'portion-machine';
  el('result-port').className = 'result-port';
  el('selection-text').textContent = 'Toque em INVERTER DIVISOR para começar.';
  el('flip-btn').disabled = false;
  el('flip-btn').className = 'flip-btn';
  el('flip-btn').querySelector('b').textContent = 'INVERTER DIVISOR';
  el('prev-btn').disabled = true;
  el('next-btn').disabled = true;
  el('confirm-btn').disabled = true;
  el('burrow').className = 'burrow';
  renderSelector(); renderPreview(); renderCombo();
}

function flipDivisor() {
  if (state.busy || state.flipped) return;
  const phase = phases[state.phase];
  state.flipped = true;
  state.selected = 0;
  playTone('select');
  el('operator').textContent = '×';
  el('divisor').textContent = phase.inverse;
  el('divisor-label').textContent = 'INVERSO';
  el('divisor-card').classList.add('flipped');
  el('portion-machine').classList.add('awake');
  el('flip-btn').classList.add('done');
  el('flip-btn').querySelector('b').textContent = 'DIVISOR INVERTIDO';
  el('flip-btn').disabled = true;
  el('prev-btn').disabled = false;
  el('next-btn').disabled = false;
  el('confirm-btn').disabled = false;
  el('selection-text').textContent = 'Agora use as setas para regular o resultado.';
  renderSelector();
}

function rotateSelector(direction) {
  if (state.busy || !state.flipped) return;
  const options = phases[state.phase].options;
  state.selected = (state.selected + direction + options.length) % options.length;
  playTone('select');
  renderSelector();
}

function renderSelector() {
  const phase = phases[state.phase];
  const hasSelection = state.selected !== null;
  el('result-choice').textContent = hasSelection ? phase.results[state.selected] : '?';
  el('result-unit').textContent = hasSelection ? phase.unit : 'aguardando';
  el('machine-result').textContent = hasSelection ? phase.results[state.selected] : '?';
  el('result-port').classList.toggle('filled', hasSelection);
  if (hasSelection) {
    el('selection-text').innerHTML = `Regulador em <strong>${phase.options[state.selected]}</strong>. Ajuste ou acione a máquina.`;
  }
  renderPreview(state.selected);
}

function renderPreview(optionIndex = null) {
  const phase = phases[state.phase];
  const preview = el('jar-preview');
  preview.innerHTML = '';
  const displayCount = optionIndex === null ? 0 : previewCount(phase.options[optionIndex]);

  if (!displayCount) {
    preview.innerHTML = '<p>Inverta o divisor<br>para começar</p>';
    return;
  }

  if (state.phase === 4) {
    const fraction = phase.results[optionIndex];
    const [n, d] = fraction.split('/').map(Number);
    for (let i = 0; i < 3; i++) {
      const plate = document.createElement('span');
      plate.className = 'cake-plate';
      plate.style.setProperty('--portion', `${360*n/d}deg`);
      plate.setAttribute('role', 'img');
      plate.setAttribute('aria-label', `Amigo ${i+1}: ${fraction} do bolo`);
      preview.appendChild(plate);
    }
    const caption = document.createElement('small');
    caption.className = 'portion-caption';
    caption.textContent = `Cada amigo: ${fraction} do bolo`;
    preview.appendChild(caption);
    return;
  }

  for (let index = 0; index < Math.ceil(displayCount); index++) {
    const jar = document.createElement('span');
    jar.className = `food-jar${index === Math.floor(displayCount) && displayCount % 1 ? ' half' : ''}`;
    jar.innerHTML = `<i>${phase.food}</i>`;
    preview.appendChild(jar);
  }
}

function previewCount(label) {
  if (label.startsWith('1/')) return 3;
  const mixed = label.match(/(\d+)\s+1\/2/);
  if (mixed) return Number(mixed[1]) + 0.5;
  const number = Number.parseInt(label, 10);
  return Number.isFinite(number) ? Math.min(number, 6) : 0;
}

function checkAnswer() {
  if (state.busy || !state.flipped || state.selected === null) return;
  state.busy = true; state.attempts++;
  const phase = phases[state.phase];
  el('prev-btn').disabled = true;
  el('next-btn').disabled = true;
  el('confirm-btn').disabled = true;

  if (state.selected === phase.answer) {
    state.correct++; state.combo++; state.savedFood++;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const points = 100 + state.combo * 25 + state.lives * 10;
    state.score += points; state.rain = Math.max(4, state.rain - 6);
    el('result-port').classList.add('correct');
    el('portion-machine').classList.add('running');
    el('burrow').classList.add('organized');
    el('martim-line').textContent = 'Porções exatas! Esta parte da despensa está protegida.';
    playTone('success');
    renderScore(); renderRain(); renderCombo();
    GameSession.after(() => openModal(
      'success', 'PROVISÕES ORGANIZADAS', state.phase === phases.length - 1 ? 'O lanche está pronto!' : 'Divisão perfeita!',
      `${phase.explanation} Você ganhou ${points} pontos.`,
      state.phase === phases.length - 1 ? 'VER A DESPENSA' : 'PRÓXIMA GALERIA',
      state.phase === phases.length - 1 ? finishGame : nextPhase
    ), 650);
  } else {
    state.combo = 0; state.lives--; state.rain = Math.min(100, state.rain + 23);
    el('result-port').classList.add('wrong');
    el('portion-machine').classList.add('jammed');
    el('burrow').classList.add('leaking');
    el('martim-line').textContent = 'Opa! Essas porções não ficaram iguais. Vamos inverter a segunda fração.';
    playTone('error');
    renderLives(); renderRain(); renderCombo();
    const out = state.lives <= 0 || state.rain >= 100;
    GameSession.after(() => openModal(
      'error', 'CONTA INCORRETA', out ? 'A água chegou às caixas!' : 'Quase lá!',
      `${phase.explanation} ${out ? 'Martim secou a galeria e preparou tudo para uma nova tentativa.' : 'Use a explicação e tente organizar novamente.'}`,
      out ? 'SECAR E RECOMEÇAR' : 'TENTAR NOVAMENTE', out ? resetGallery : retryPhase
    ), 760);
  }
}

function retryPhase() {
  state.selected = null; state.flipped = false; state.busy = false;
  el('burrow').className = 'burrow';
  el('portion-machine').className = 'portion-machine';
  el('result-port').className = 'result-port';
  el('operator').textContent = '÷';
  el('divisor').textContent = phases[state.phase].divisor;
  el('divisor-label').textContent = 'PORÇÃO';
  el('divisor-card').className = 'math-card divisor-card';
  el('martim-line').textContent = phases[state.phase].speech;
  el('selection-text').textContent = 'Toque em INVERTER DIVISOR para começar.';
  el('flip-btn').disabled = false;
  el('flip-btn').className = 'flip-btn';
  el('flip-btn').querySelector('b').textContent = 'INVERTER DIVISOR';
  el('prev-btn').disabled = true;
  el('next-btn').disabled = true;
  el('confirm-btn').disabled = true;
  renderSelector(); renderPreview();
}

function resetGallery() {
  state.lives = 3; state.rain = Math.min(70, 8 + state.phase * 5);
  renderLives(); renderRain(); retryPhase();
}

function nextPhase() { loadPhase(state.phase + 1); }

function renderLives() {
  GameHearts.render(el('hearts'), state.lives);
}

function renderScore() { el('score').textContent = state.score; }

function renderRain() {
  el('rain-number').textContent = `${state.rain}%`;
  el('rain-fill').style.width = `${state.rain}%`;
}

function renderCombo() { el('combo').textContent = `${state.combo}x`; }

function openModal(type, label, title, message, button, action) {
  modalAction = action; state.busy = true;
  el('modal-card').className = type;
  el('modal-icon').textContent = type === 'success' ? '✓' : '!';
  el('modal-label').textContent = label;
  el('modal-title').textContent = title;
  el('modal-text').textContent = message;
  el('modal-btn').textContent = button;
  el('modal').classList.remove('hidden');
  el('modal-btn').focus();
}

function hideModal() { el('modal').classList.add('hidden'); modalAction = null; }

function continueModal() {
  const action = modalAction;
  hideModal();
  if (action) action();
}

function finishGame() {
  state.active = false; state.busy = false;
  const accuracy = state.attempts ? Math.round((state.correct / state.attempts) * 100) : 100;
  const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;
  el('accuracy').textContent = `${accuracy}%`;
  el('saved-food').textContent = `${state.savedFood}/5`;
  el('best-combo').textContent = `${state.bestCombo}x`;
  el('stars').textContent = `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`;
  showScreen('result');
}

el('start-btn').addEventListener('click', startGame);
el('home-btn').addEventListener('click', goHome);
el('flip-btn').addEventListener('click', flipDivisor);
el('prev-btn').addEventListener('click', () => rotateSelector(-1));
el('next-btn').addEventListener('click', () => rotateSelector(1));
el('confirm-btn').addEventListener('click', checkAnswer);
el('modal-btn').addEventListener('click', continueModal);
el('restart-btn').addEventListener('click', startGame);
el('continue-btn').addEventListener('click', () => location.href = '../index.html');

addEventListener('keydown', event => {
  if (!el('play').classList.contains('active') || state.busy || GamePrefs.paused || event.target.closest('button, input, select')) return;
  if ((event.key === ' ' || event.key === 'Spacebar') && !state.flipped) {
    event.preventDefault();
    flipDivisor();
  }
  if (event.key === 'ArrowLeft' && state.flipped) {
    event.preventDefault(); rotateSelector(-1);
  }
  if (event.key === 'ArrowRight' && state.flipped) {
    event.preventDefault(); rotateSelector(1);
  }
  if (event.key === 'Enter' && state.selected !== null) {
    checkAnswer();
  }
});

prepareCharacterArt();

window.getGameHint = () => 'Mantenha '+phases[state.phase].dividend+' e multiplique por '+phases[state.phase].inverse+', o inverso de '+phases[state.phase].divisor+'.';
