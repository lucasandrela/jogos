const phases = [
  {
    title: 'O Salão das Tochas', challenge: 'Acenda metade das tochas',
    question: 'Há 8 tochas. Quantas representam 1/2 do total?', clue: '1/2 de 8',
    options: ['2', '4', '6'], answer: 1, trap: 'darts',
    speech: 'Meu faro diz que a pista está nas tochas...', explanation: 'Metade de 8 é 4, pois 8 ÷ 2 = 4.'
  },
  {
    title: 'A Galeria dos Escaravelhos', challenge: 'Encontre a fração equivalente',
    question: 'Qual placa representa a mesma quantidade que 1/2?', clue: 'Partes diferentes, mesmo valor',
    options: ['2/4', '2/3', '3/5'], answer: 0, trap: 'spikes',
    speech: 'Duas partes de quatro podem valer o mesmo que uma de duas.', explanation: '2/4 simplifica para 1/2: as duas frações representam metade.'
  },
  {
    title: 'O Corredor da Areia', challenge: 'Complete a sequência antiga',
    question: 'Qual fração completa: 1/4, 2/4, 3/4, ___?', clue: 'Some mais 1/4',
    options: ['3/5', '4/4', '5/4'], answer: 1, trap: 'sand',
    speech: 'O chão está afundando. Procure o padrão com calma!', explanation: 'A sequência cresce de 1/4 em 1/4. Depois de 3/4 vem 4/4, que vale 1 inteiro.'
  },
  {
    title: 'A Câmara da Pedra', challenge: 'Escolha a maior passagem',
    question: 'Qual destas frações é a maior?', clue: 'Compare quanto falta para 1',
    options: ['1/2', '2/3', '3/4'], answer: 2, trap: 'boulder',
    speech: 'Escuto uma pedra rolando... precisamos da maior fração!', explanation: '3/4 é maior que 2/3 e 1/2. Ela é a que está mais próxima de 1 inteiro.'
  },
  {
    title: 'O Portal do Faraó', challenge: 'Complete o selo final',
    question: 'O selo tem 1/4. Quanto falta para formar 1 inteiro?', clue: '1/4 + ? = 1',
    options: ['1/2', '2/4', '3/4'], answer: 2, trap: 'guardian',
    speech: 'Última porta! Vamos completar o inteiro e encontrar o pergaminho.', explanation: 'Faltam 3/4, porque 1/4 + 3/4 = 4/4 = 1 inteiro.'
  }
];

const state = {
  phase: 0, lives: 3, score: 0, danger: 10, selected: null,
  attempts: 0, correct: 0, combo: 0, bestCombo: 0, safePlates: 0,
  active: false, busy: false
};

const el = id => document.getElementById(id);
let modalAction = null;

function prepareCharacterArt() { document.querySelectorAll('.clarice-img').forEach(image => image.classList.add('ready')); }

function prepareGeneratedArt() { document.querySelectorAll('.cutout-image').forEach(image => image.classList.add('ready')); }

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.toggle('active', screen.id === id));
}

function startGame() {
  GameSession.cancel(); hideModal();
  Object.assign(state, {phase: 0, lives: 3, score: 0, danger: 10, selected: null, attempts: 0, correct: 0, combo: 0, bestCombo: 0, safePlates: 0, active: true, busy: false});
  renderScore(); renderLives(); renderDanger(); showScreen('play'); loadPhase(0);
}

function goHome() {
  GameSession.cancel();
  state.active = false; state.busy = false; hideModal(); showScreen('intro');
}

function loadPhase(index) {
  state.phase = index; state.selected = null; state.busy = false;
  const phase = phases[index];
  el('phase-count').textContent = `CÂMARA ${index + 1} DE ${phases.length}`;
  el('phase-title').textContent = phase.title;
  el('challenge-title').textContent = phase.challenge;
  el('challenge-question').textContent = phase.question;
  el('clue').textContent = phase.clue;
  el('clarice-line').textContent = phase.speech;
  el('selection-text').textContent = 'Nenhuma placa escolhida.';
  el('confirm-btn').disabled = true;
  el('chamber').className = 'chamber';
  el('trap-layer').className = 'trap-layer';
  renderOptions(); renderCombo();
}

function renderOptions() {
  const box = el('options'); box.innerHTML = '';
  phases[state.phase].options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `stone${state.selected === index ? ' selected' : ''}`;
    button.textContent = option;
    button.setAttribute('aria-pressed', state.selected === index ? 'true' : 'false');
    button.setAttribute('aria-label', `Placa ${option}`);
    button.disabled = state.busy;
    button.addEventListener('click', () => selectOption(index));
    box.appendChild(button);
  });
}

function selectOption(index) {
  if (state.busy) return;
  state.selected = index;
  el('selection-text').innerHTML = `Placa escolhida: <strong>${phases[state.phase].options[index]}</strong>`;
  el('confirm-btn').disabled = false;
  renderOptions();
}

function checkAnswer() {
  if (state.busy || state.selected === null) return;
  state.busy = true; state.attempts++;
  const phase = phases[state.phase];
  const buttons = [...document.querySelectorAll('.stone')];
  buttons.forEach(button => button.disabled = true);

  if (state.selected === phase.answer) {
    state.correct++; state.combo++; state.safePlates++;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const points = 100 + state.combo * 25 + state.lives * 10;
    state.score += points; state.danger = Math.max(5, state.danger - 8);
    buttons[state.selected].classList.add('correct');
    el('chamber').classList.add('cleared');
    el('clarice-line').textContent = 'Passagem segura! O mecanismo foi desativado.';
    renderScore(); renderDanger(); renderCombo();
    GameSession.after(() => openModal(
      'success', 'PASSAGEM SEGURA', state.phase === phases.length - 1 ? 'O selo se abriu!' : 'Enigma resolvido!',
      `${phase.explanation} Você ganhou ${points} pontos.`,
      state.phase === phases.length - 1 ? 'VER O PERGAMINHO' : 'PRÓXIMA CÂMARA',
      state.phase === phases.length - 1 ? finishGame : nextPhase
    ), 620);
  } else {
    state.combo = 0; state.lives--; state.danger = Math.min(100, state.danger + 22);
    buttons[state.selected].classList.add('wrong');
    buttons[phase.answer].classList.add('correct');
    triggerTrap(phase.trap); renderLives(); renderDanger(); renderCombo();
    const out = state.lives <= 0 || state.danger >= 100;
    GameSession.after(() => openModal(
      'error', 'ARMADILHA ATIVADA', trapTitle(phase.trap),
      `${phase.explanation} ${out ? 'Clarice voltou ao início desta câmara para recuperar o fôlego.' : 'Observe a explicação e escolha novamente.'}`,
      out ? 'RECOMEÇAR A CÂMARA' : 'TENTAR NOVAMENTE', out ? resetChamber : retryPhase
    ), 760);
  }
}

function triggerTrap(trap) {
  const layer = el('trap-layer');
  const chamber = el('chamber');
  layer.className = `trap-layer trigger-${trap}`;
  chamber.classList.add('shake');
  el('clarice-line').textContent = trapSpeech(trap);
  GameSession.after(() => chamber.classList.remove('shake'), 550);
}

function trapTitle(trap) {
  return ({darts:'Os dardos dispararam!',spikes:'Espinhos no caminho!',sand:'A areia começou a subir!',boulder:'A pedra está rolando!',guardian:'O guardião despertou!'})[trap];
}

function trapSpeech(trap) {
  return ({darts:'Abaixem-se! A placa acionou os dardos!',spikes:'Essa não! Espinhos sob o piso!',sand:'Rápido, antes que a areia encha a sala!',boulder:'Corram! Uma pedra gigante!',guardian:'O olho do faraó está brilhando!'})[trap];
}

function retryPhase() {
  state.selected = null; state.busy = false;
  el('trap-layer').className = 'trap-layer'; el('chamber').className = 'chamber';
  el('clarice-line').textContent = phases[state.phase].speech;
  el('selection-text').textContent = 'Nenhuma placa escolhida.';
  el('confirm-btn').disabled = true; renderOptions();
}

function resetChamber() {
  state.lives = 3; state.danger = Math.max(10, 10 + state.phase * 4);
  renderLives(); renderDanger(); retryPhase();
}

function nextPhase() { loadPhase(state.phase + 1); }

function renderLives() {
  el('hearts').textContent = `${'● '.repeat(state.lives)}${'○ '.repeat(3 - state.lives)}`.trim();
  el('hearts').setAttribute('aria-label', `${state.lives} ${state.lives === 1 ? 'vida' : 'vidas'}`);
}
function renderScore() { el('score').textContent = state.score; }
function renderDanger() {
  el('danger-number').textContent = `${state.danger}%`;
  el('danger-fill').style.width = `${state.danger}%`;
}
function renderCombo() { el('combo').textContent = `${state.combo}x`; }

function openModal(type, label, title, text, button, action) {
  modalAction = action; state.busy = true;
  el('modal-card').className = type;
  el('modal-icon').textContent = type === 'success' ? '✓' : '!';
  el('modal-label').textContent = label; el('modal-title').textContent = title;
  el('modal-text').textContent = text; el('modal-btn').textContent = button;
  el('modal').classList.remove('hidden'); el('modal-btn').focus();
}
function hideModal() { el('modal').classList.add('hidden'); modalAction = null; }
function continueModal() { const action = modalAction; hideModal(); if (action) action(); }

function finishGame() {
  state.active = false; state.busy = false;
  const accuracy = state.attempts ? Math.round((state.correct / state.attempts) * 100) : 100;
  const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;
  el('accuracy').textContent = `${accuracy}%`;
  el('safe-plates').textContent = state.safePlates;
  el('best-combo').textContent = `${state.bestCombo}x`;
  el('stars').textContent = `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`;
  showScreen('result');
}

el('start-btn').addEventListener('click', startGame);
el('home-btn').addEventListener('click', goHome);
el('confirm-btn').addEventListener('click', checkAnswer);
el('modal-btn').addEventListener('click', continueModal);
el('restart-btn').addEventListener('click', startGame);
el('continue-btn').addEventListener('click', () => location.href = '../index.html');
addEventListener('keydown', event => {
  if (event.key >= '1' && event.key <= '3' && !state.busy && el('play').classList.contains('active')) selectOption(Number(event.key) - 1);
  if (event.key === 'Enter' && state.selected !== null && !state.busy && el('play').classList.contains('active')) checkAnswer();
});
prepareCharacterArt();
prepareGeneratedArt();

window.getGameHint = () => ['Divida o total em 2 grupos iguais.', 'Multiplique o numerador e o denominador pelo mesmo número.', 'O número de baixo continua 4. Conte mais uma parte.', 'Compare usando doze partes: 1/2 = 6/12, 2/3 = 8/12 e 3/4 = 9/12.', 'Um inteiro tem quatro quartos. Tire a parte que já está no selo.'][state.phase];
