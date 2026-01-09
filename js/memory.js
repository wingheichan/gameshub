
// Memory game with modes: closed, preview (configurable), always-open
(async function(){
  const difficultySelect = document.getElementById('memoryDifficulty');
  const modeSelect = document.getElementById('memoryMode');
  const previewInput = document.getElementById('previewDuration');
  const startBtn = document.getElementById('startMemoryBtn');
  const statusEl = document.getElementById('memoryStatus');
  const grid = document.getElementById('grid');
  const movesEl = document.getElementById('movesCount');
  const timerEl = document.getElementById('timer');
  const matchedEl = document.getElementById('matchedPairs');
  const restartBtn = document.getElementById('restartMemoryBtn');

  let pairsData = [];
  try { const res = await fetch('data/memory_cards.json'); pairsData = await res.json(); }
  catch(e){ statusEl.textContent = 'Failed to load cards.'; console.error(e); return; }

  const state = { deck: [], flipped: [], matched: new Set(), moves: 0, seconds: 0, timerId: null, mode: 'closed', previewTimeoutId: null };

  function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
  function gridSize(diff){ switch(diff){ case 'easy': return [4,4]; case 'medium': return [5,4]; case 'hard': return [6,6]; default: return [4,4]; } }
  function buildDeck(diff){ const [cols, rows] = gridSize(diff); const total = cols*rows; const neededPairs = total/2; const selected = shuffle([...pairsData]).slice(0, neededPairs); const deck = []; selected.forEach((p, idx) => { deck.push({ id:`p${idx}-a`, pairId:idx, label:p.a }); deck.push({ id:`p${idx}-b`, pairId:idx, label:p.b }); }); return shuffle(deck); }

  function renderGrid(diff){ grid.className = `grid ${diff}`; grid.innerHTML=''; state.deck.forEach(card => { const btn = document.createElement('button'); btn.className='card-tile'; btn.setAttribute('data-id', card.id);
    if (state.mode === 'always-open' || state.mode === 'preview'){ btn.textContent = card.label; btn.classList.add('flipped'); }
    else { btn.textContent = '❓'; }
    btn.addEventListener('click', () => onCardClick(btn, card));
    grid.appendChild(btn);
  }); }

  function updateStats(){ movesEl.textContent = `Moves: ${state.moves}`; matchedEl.textContent = `Matched: ${state.matched.size}`; }
  function startTimer(){ clearInterval(state.timerId); state.seconds = 0; timerEl.textContent = 'Time: 0s'; state.timerId = setInterval(() => { state.seconds++; timerEl.textContent = `Time: ${state.seconds}s`; }, 1000); }

  function closeAllUnmatched(){ [...grid.querySelectorAll('.card-tile')].forEach(el => { if (!el.classList.contains('matched')) { el.classList.remove('flipped'); el.textContent = '❓'; } }); }

  function labelForId(id){ const c = state.deck.find(x => x.id === id); return c ? c.label : ''; }

  function onCardClick(btn, card){
    // During preview countdown, ignore clicks
    if (state.mode === 'preview' && btn.classList.contains('preview-lock')) return;

    if (state.matched.has(card.pairId)) return;

    // Reveal on click for both closed and preview modes
    if (state.mode === 'closed' || state.mode === 'preview') {
      btn.classList.add('flipped');
      btn.textContent = card.label;
    }
    // In always-open, already face-up; add selection highlight
    if (state.mode === 'always-open') { btn.classList.add('flipped'); }

    // Prevent selecting same card twice
    if (state.flipped.some(c => c.id === card.id)) return;
    state.flipped.push(card);

    if (state.flipped.length === 2){
      state.moves++; updateStats();
      const [c1, c2] = state.flipped;
      const match = c1.pairId === c2.pairId && c1.id !== c2.id;
      if (match){
        state.matched.add(c1.pairId);
        // Turn matched pair green, show labels, disable
        [...grid.querySelectorAll('.card-tile')].forEach(el => {
          const id = el.getAttribute('data-id');
          if (id === c1.id || id === c2.id){
            el.classList.add('matched');
            el.textContent = labelForId(id);
            el.disabled = true;
          }
        });
        statusEl.textContent = 'Matched!';
        state.flipped = [];
        checkWin();
      } else {
        statusEl.textContent = 'Try again…';
        setTimeout(() => {
          if (state.mode === 'closed' || state.mode === 'preview') {
            // Hide labels again in closed/preview
            [...grid.querySelectorAll('.card-tile.flipped:not(.matched)')].forEach(el => { el.classList.remove('flipped'); el.textContent = '❓'; });
          } else if (state.mode === 'always-open') {
            // Keep labels visible; remove selection highlight only
            [...grid.querySelectorAll('.card-tile.flipped:not(.matched)')].forEach(el => { el.classList.remove('flipped'); el.textContent = labelForId(el.getAttribute('data-id')); });
          }
          state.flipped = [];
        }, 700);
      }
    }
  }

  function checkWin(){ if (state.matched.size * 2 === state.deck.length){ clearInterval(state.timerId); statusEl.textContent = `You win! Moves: ${state.moves}, Time: ${state.seconds}s`; restartBtn.hidden = false; } }

  function startGame(){
    clearInterval(state.timerId); clearTimeout(state.previewTimeoutId);
    const diff = difficultySelect.value; state.mode = modeSelect.value; const previewSecs = Math.max(5, Math.min(30, parseInt(previewInput.value) || 10));
    statusEl.textContent = 'Good luck!'; state.deck = buildDeck(diff); state.flipped = []; state.matched = new Set(); state.moves = 0; updateStats(); renderGrid(diff); startTimer(); restartBtn.hidden = true;

    if (state.mode === 'preview') {
      // Lock clicks during preview
      [...grid.querySelectorAll('.card-tile')].forEach(el => el.classList.add('preview-lock'));
      state.previewTimeoutId = setTimeout(() => {
        closeAllUnmatched();
        // Unlock clicks
        [...grid.querySelectorAll('.card-tile')].forEach(el => el.classList.remove('preview-lock'));
        statusEl.textContent = 'Preview over—start matching!';
      }, previewSecs * 1000);
    }
  }

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
})();
