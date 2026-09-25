const phases = [
  { title:'Frações simples', challenge:'Complete 1 inteiro', hint:'Escolha troncos que formem o valor pedido.', speech:'Vamos começar com uma barragem pequena.', target:1, label:'1', pressure:25, logs:[[1,2],[1,4],[1,4],[1,3]] },
  { title:'Frações equivalentes', challenge:'Encontre um tronco equivalente a 1/2', hint:'Escolha somente um tronco com o mesmo valor.', speech:'Alguns troncos parecem diferentes, mas ocupam o mesmo espaço!', target:1/2, label:'1/2', pressure:32, single:true, logs:[[2,4],[3,4],[2,3],[1,4]] },
  { title:'Somando frações', challenge:'Construa uma camada de 5/6', hint:'Some frações com partes do mesmo tamanho.', speech:'Transforme as partes em sextos e encontre a soma.', target:5/6, label:'5/6', pressure:40, logs:[[1,6],[2,6],[3,6],[4,6]] },
  { title:'Escolha estratégica', challenge:'Preencha exatamente 1 inteiro', hint:'Existem diferentes combinações corretas.', speech:'Frações diferentes podem formar exatamente a mesma quantidade.', target:1, label:'1', pressure:52, logs:[[1,2],[1,2],[1,4],[1,4],[2,8],[6,8]] },
  { title:'Desafio final', challenge:'Use exatamente 2 inteiros de madeira', hint:'Encontre uma combinação igual a 2 e mantenha a mão firme.', speech:'Última camada! A correnteza está no máximo!', target:2, label:'2', pressure:65, final:true, logs:[[1,2],[3,4],[1,4],[2,4],[1,2],[1,4]] }
];

// Beaver sprite poses
const BEAVER_POSES = {
  idle: '../assets/personagens/bento.png',
  holding: '../assets/personagens/bento.png',
  celebrate: '../assets/personagens/bento.png',
  worried: '../assets/personagens/bento.png'
};

const freshState = () => ({
  phase:0, selected:new Set(), lives:3, pressure:25, score:0,
  mode:'select', active:false, busy:false, aim:8, direction:1,
  placed:0, combo:0, bestCombo:0, attempts:0, correct:0
});

let state = freshState();
let pressureTimer = null;
let lastFrame = 0;
let modalAction = null;
const el = id => document.getElementById(id);

// Change beaver sprite pose
function setBeaverPose(pose) {
  const sprite = el('bento-sprite');
  if (sprite && BEAVER_POSES[pose]) {
    sprite.src = BEAVER_POSES[pose];
  }
}

// Change modal beaver image
function setModalBeaver(pose) {
  const modalBeaverEl = el('modal-beaver');
  if (modalBeaverEl && BEAVER_POSES[pose]) {
    modalBeaverEl.src = BEAVER_POSES[pose];
  }
}

function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));el(id).classList.add('active')}
function stopPressure(){if(pressureTimer)clearInterval(pressureTimer);pressureTimer=null}

function startGame(){
  GameSession.cancel(); hideModal();
  stopPressure(); state=freshState(); state.active=true; el('dam-layers').innerHTML='';
  showScreen('play'); loadPhase(0); startPressure();
}

function goHome(){
  GameSession.cancel();
  state.active=false; state.busy=false; stopPressure(); hideModal(); showScreen('intro');
}

function loadPhase(index){
  state.phase=index; state.selected.clear(); state.lives=3; state.pressure=phases[index].pressure;
  state.mode='select'; state.busy=false; clearBadLayers(); hideFalling();
  const p=phases[index];
  el('phase-count').textContent=`FASE ${index+1} DE ${phases.length}`;
  el('phase-title').textContent=p.title; el('challenge-title').textContent=p.challenge;
  el('challenge-hint').textContent=p.hint; el('target').textContent=p.label;
  el('bento-line').textContent=p.speech; el('instruction').textContent=p.single?'Escolha somente um tronco.':'Selecione uma combinação.';
  el('check-area').classList.remove('hidden'); el('drop-area').classList.add('hidden'); el('clear-btn').disabled=false;
  setBeaverPose('idle');
  renderLives(); renderPressure(); renderScore(); renderOptions(); renderEquation();
}

function value(f){return f[0]/f[1]}
function label(f){return `${f[0]}/${f[1]}`}
function gcd(a,b){while(b)[a,b]=[b,a%b];return Math.abs(a)}
function formatNumber(number){
  if(Math.abs(number-Math.round(number))<1e-9)return `${Math.round(number)}`;
  for(let d=2;d<=48;d++){const n=Math.round(number*d);if(Math.abs(n/d-number)<1e-9){const g=gcd(n,d);return `${n/g}/${d/g}`}}
  return number.toFixed(2);
}
function selectedFractions(){const p=phases[state.phase];return [...state.selected].map(i=>p.logs[i])}
function selectedSum(){return selectedFractions().reduce((sum,f)=>sum+value(f),0)}

function renderOptions(){
  const p=phases[state.phase],box=el('options'); box.innerHTML='';
  p.logs.forEach((fraction,index)=>{
    const button=document.createElement('button'),chosen=state.selected.has(index);
    button.type='button'; button.className=`log${chosen?' selected':''}${state.mode!=='select'?' locked':''}`;
    button.style.width=`${78+Math.min(100,value(fraction)*90)}px`; button.textContent=label(fraction);
    button.setAttribute('aria-label',`Tronco ${label(fraction)}`); button.setAttribute('aria-pressed',chosen);
    button.addEventListener('click',()=>toggleOption(index)); box.appendChild(button);
  });
}

function toggleOption(index){
  if(state.mode!=='select'||state.busy)return; const p=phases[state.phase];
  if(p.single&&!state.selected.has(index))state.selected.clear();
  state.selected.has(index)?state.selected.delete(index):state.selected.add(index);
  // Change pose when selecting
  if(state.selected.size > 0) setBeaverPose('holding');
  else setBeaverPose('idle');
  renderOptions(); renderEquation();
}

function clearSelection(){if(state.mode!=='select'||state.busy)return;state.selected.clear();setBeaverPose('idle');renderOptions();renderEquation()}
function renderEquation(){
  const parts=selectedFractions().map(label),sum=selectedSum();
  el('equation').textContent=`${parts.length?parts.join(' + '):'0'} = ${formatNumber(sum)}`;
  el('check-btn').disabled=state.selected.size===0||state.mode!=='select';
  renderFractionVisual(sum);
}

function selectionCorrect(){const p=phases[state.phase];return (!p.single||state.selected.size===1)&&Math.abs(selectedSum()-p.target)<1e-9}

function checkFractions(){
  if(state.busy||state.mode!=='select'||!state.selected.size)return; state.attempts++;
  if(selectionCorrect()){
    state.correct++; state.mode='aim'; state.aim=8; state.direction=1;
    el('bento-line').textContent=GamePrefs.practice ? 'Soma certa! Toque em SOLTAR para construir.' : 'Soma certa! Solte quando a mira estiver verde.';
    setBeaverPose('celebrate');
    el('check-area').classList.add('hidden'); el('drop-area').classList.remove('hidden'); el('clear-btn').disabled=true;
    renderOptions(); prepareFalling(); return;
  }
  state.combo=0; state.lives--; changePressure(12); addLayer(true,true); renderLives();
  setBeaverPose('worried');
  const ended=state.lives<=0||state.pressure>=100;
  openModal('error','BARRAGEM INSTÁVEL','Essa combinação não completa a camada.',`Sua soma foi ${formatNumber(selectedSum())}. O alvo é ${phases[state.phase].label}. ${ended?'As vidas acabaram. Bento vai reconstruir a barragem desde a primeira fase.':'Observe o tamanho das partes e tente novamente.'}`,ended?'RECOMEÇAR DO INÍCIO':'TENTAR NOVAMENTE',ended?startGame:resetSelection);
}

function prepareFalling(){
  const box=el('falling-pieces'); box.innerHTML='';
  selectedFractions().forEach(f=>{const piece=document.createElement('span');piece.className='fall-piece';piece.style.width=`${42+Math.min(90,value(f)*88)}px`;piece.textContent=label(f);box.appendChild(piece)});
  el('falling').className='falling swing';
}
function hideFalling(){el('falling').className='falling hidden';el('falling-pieces').innerHTML=''}

function addLayer(bad=false,temporary=false){
  const layer=document.createElement('div'); layer.className=`layer${bad?' bad':''}`; if(temporary)layer.dataset.temporary='true';
  selectedFractions().forEach(f=>{const piece=document.createElement('span');piece.className='layer-piece';piece.style.width=`${42+Math.min(95,value(f)*90)}px`;piece.textContent=label(f);layer.appendChild(piece)});
  el('dam-layers').appendChild(layer);
}
function clearBadLayers(){document.querySelectorAll('[data-temporary="true"]').forEach(node=>node.remove())}

function dropLogs(){
  if(state.busy||state.mode!=='aim')return; state.busy=true; state.mode='dropping';
  const distance=Math.abs(state.aim-50),stable=GamePrefs.practice || distance<=18,perfect=GamePrefs.practice || distance<=8;
  el('falling').className=`falling ${stable?'good':'bad'}`;
  GameSession.after(()=>stable?stableDrop(perfect):unstableDrop(),720);
}

function stableDrop(perfect){
  state.combo++; state.bestCombo=Math.max(state.bestCombo,state.combo); state.placed+=state.selected.size;
  clearBadLayers(); addLayer(); hideFalling(); const points=100+(perfect?75:35)+state.combo*15;
  state.score+=points; changePressure(-16); renderScore(); const p=phases[state.phase];
  setBeaverPose('celebrate');
  setModalBeaver('celebrate');
  openModal('success',perfect?'ENCAIXE PERFEITO':'CAMADA FIRME',perfect?'Perfeito!':'Muito bem!',`A matemática e o lançamento deram certo. Você ganhou ${points} pontos.`,p.final?'VER RESULTADO':'PRÓXIMA FASE',p.final?finishGame:nextPhase);
}

function unstableDrop(){
  state.combo=0; state.lives--; addLayer(true,true); hideFalling(); changePressure(9); renderLives();
  setBeaverPose('worried');
  setModalBeaver('worried');
  const ended=state.lives<=0||state.pressure>=100;
  openModal('error','TENTE O LANÇAMENTO','A conta estava certa, mas o tronco caiu torto!',ended?'As vidas acabaram. Bento vai reconstruir a barragem desde a primeira fase.':'A soma está certa e foi mantida. Toque em Soltar quando o marcador estiver verde.',ended?'RECOMEÇAR DO INÍCIO':'TENTAR O LANÇAMENTO',ended?startGame:retryAim);
}

function retryAim(){state.busy=false;state.mode='aim';state.aim=8;state.direction=1;state.lives=Math.max(1,state.lives);state.pressure=Math.min(80,state.pressure);clearBadLayers();prepareFalling();renderLives();renderPressure();}

function resetSelection(){
  state.selected.clear(); state.mode='select'; state.busy=false; el('bento-line').textContent=phases[state.phase].speech;
  el('check-area').classList.remove('hidden'); el('drop-area').classList.add('hidden'); el('clear-btn').disabled=false;
  setBeaverPose('idle');
  hideFalling(); renderOptions(); renderEquation();
}
function resetRound(){clearBadLayers();state.lives=3;state.pressure=phases[state.phase].pressure;renderLives();renderPressure();resetSelection()}
function nextPhase(){loadPhase(state.phase+1)}

function renderLives(){
  GameHearts.render(el('hearts'), state.lives);
  // Update beaver based on lives
  if(state.lives <= 1 && state.mode === 'select') setBeaverPose('worried');
}
function renderScore(){el('score').textContent=state.score}
function changePressure(amount){state.pressure=Math.max(5,Math.min(100,state.pressure+amount));renderPressure()}
function renderPressure(){const p=Math.round(state.pressure);el('pressure-number').textContent=`${p}%`;el('pressure-fill').style.width=`${p}%`}

function startPressure(){
  stopPressure(); if(GamePrefs.practice)return; pressureTimer=setInterval(()=>{
    if(GamePrefs.paused||!state.active||state.busy||!el('modal').classList.contains('hidden'))return;
    changePressure(phases[state.phase].final?2:1); if(state.pressure>=100)riverBurst();
  },3000);
}
function riverBurst(){
  if(state.busy)return; state.busy=true;
  setBeaverPose('worried');
  setModalBeaver('worried');
  openModal('error','PRESSÃO MÁXIMA','A correnteza venceu esta rodada.','Bento vai reconstruir a barragem desde a primeira fase.','RECOMEÇAR DO INÍCIO',startGame);
}

function openModal(type,kicker,title,text,button,action){
  state.busy=true; modalAction=action; el('modal-card').className=type; el('modal-icon').textContent=type==='success'?'✓':'!';
  // Set modal beaver pose
  setModalBeaver(type === 'success' ? 'celebrate' : 'worried');
  el('modal-label').textContent=kicker; el('modal-title').textContent=title; el('modal-text').textContent=text; el('modal-btn').textContent=button;
  el('modal').classList.remove('hidden'); el('modal-btn').focus();
}
function hideModal(){el('modal').classList.add('hidden');modalAction=null}
function continueModal(){const action=modalAction;hideModal();if(action)action()}

function finishGame(){
  state.active=false; state.busy=false; stopPressure(); const accuracy=state.attempts?Math.round(state.correct/state.attempts*100):100;
  const stars=accuracy>=90?3:accuracy>=70?2:1; el('accuracy').textContent=`${accuracy}%`; el('logs-total').textContent=state.placed;
  el('best-combo').textContent=state.bestCombo; el('stars').textContent=`${'★'.repeat(stars)}${'☆'.repeat(3-stars)}`; showScreen('result');
}

function animateAim(time){
  const elapsed=Math.min(40,time-lastFrame||16); lastFrame=time;
  if(state.active&&state.mode==='aim'&&!state.busy&&!GamePrefs.paused){
    state.aim=GamePrefs.practice?50:state.aim+state.direction*elapsed*(phases[state.phase].final?.075:.052);
    if(state.aim>=98){state.aim=98;state.direction=-1}if(state.aim<=2){state.aim=2;state.direction=1}
    el('cursor').style.left=`calc(${state.aim}% - 4px)`; const distance=Math.abs(state.aim-50);
    el('aim-label').textContent=distance<=8?'PERFEITO':distance<=18?'BOM':'INSTÁVEL';
  }
  requestAnimationFrame(animateAim);
}

el('start-btn').addEventListener('click',startGame); el('home-btn').addEventListener('click',goHome);
el('clear-btn').addEventListener('click',clearSelection); el('check-btn').addEventListener('click',checkFractions);
el('drop-btn').addEventListener('click',dropLogs); el('modal-btn').addEventListener('click',continueModal);
el('restart-btn').addEventListener('click',startGame); el('continue-btn').addEventListener('click', () => location.href = '../index.html');
addEventListener('keydown',event=>{if(event.code==='Space'&&state.mode==='aim'&&!state.busy&&!GamePrefs.paused&&!event.target.closest('button, input, select')){event.preventDefault();dropLogs()}});
requestAnimationFrame(animateAim);

window.getGameHint = () => ['Para somar, use partes do mesmo tamanho. Metade equivale a dois quartos.', 'Multiplique ou divida o numerador e o denominador pelo mesmo número.', 'Os denominadores já são iguais: some apenas os numeradores.', 'Você pode trocar 1/2 por 2/4 sem mudar o valor.', 'Separe os troncos em dois grupos. Cada grupo precisa formar 1.'][state.phase];

function renderFractionVisual(sum) {
  const phase = phases[state.phase];
  const divisions = phase.logs.reduce((d, f) => d * f[1] / gcd(d, f[1]), 1);
  const box = el('fraction-visual');
  box.innerHTML = '<small>Cada barra vale 1 inteiro</small>';
  for (let i = 0; i < Math.max(1, Math.ceil(phase.target), Math.ceil(sum - 1e-9)); i++) {
    const bar = document.createElement('div');
    bar.className = 'fraction-unit';
    bar.style.setProperty('--parts', divisions);
    const fill = document.createElement('i');
    fill.style.width = Math.max(0, Math.min(1, sum - i)) * 100 + '%';
    fill.style.background = Math.abs(sum-phase.target) < 1e-9 ? '#308361' : sum > phase.target ? '#b84943' : '#397eab';
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', `Barra ${i+1}: ${formatNumber(Math.max(0, Math.min(1, sum-i)))} de 1 inteiro`);
    bar.appendChild(fill); box.appendChild(bar);
  }
}
