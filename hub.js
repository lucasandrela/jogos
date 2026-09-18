(() => {
  'use strict';
  const dialog = document.getElementById('about-dialog');
  const adventures = document.getElementById('aventuras');
  const cards = [...document.querySelectorAll('.game-card')];
  const progressCopy = document.getElementById('progress-copy');
  const progressFill = document.getElementById('progress-fill');

  document.getElementById('about-btn').addEventListener('click', () => dialog.showModal());
  document.getElementById('about-close').addEventListener('click', () => dialog.close());
  document.getElementById('about-play').addEventListener('click', () => {
    dialog.close();
    adventures.scrollIntoView({ behavior: 'smooth' });
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  function refreshProgress() {
  let completedCount = 0;
  cards.forEach(card => {
    card.classList.remove('started', 'completed');
    const slug = card.dataset.game;
    const status = card.querySelector('.status');
    const completed = GameStore.getItem(`amigosDoSilas.${slug}.completed`) === 'true';
    const started = GameStore.getItem(`amigosDoSilas.${slug}.started`) === 'true';
    if (completed) {
      completedCount += 1;
      card.classList.add('completed');
      const stars = Number(GameStore.getItem(`amigosDoSilas.${slug}.stars`)) || 0;
      status.textContent = stars ? `${'★'.repeat(stars)} Concluída` : 'Aventura concluída';
    } else if (started) {
      card.classList.add('started');
      status.textContent = 'Jogar novamente';
    }
  });

  progressCopy.textContent = `${completedCount} de ${cards.length} concluídos`;
  progressFill.style.width = `${(completedCount / cards.length) * 100}%`;

  const main = document.querySelector('.primary-link');
  main.textContent = 'ESCOLHER AVENTURA ↓';
  main.href = '#aventuras';
  const firstPending = cards.find(card => !card.classList.contains('completed'));
  if (firstPending && completedCount > 0) {
    const mainLink = document.querySelector('.primary-link');
    mainLink.textContent = 'CONTINUAR A SAGA →';
    mainLink.href = firstPending.getAttribute('href');
  }
  }
  refreshProgress();
  addEventListener('pageshow', refreshProgress);
  addEventListener('storage', refreshProgress);
})();
