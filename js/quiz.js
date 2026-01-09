
(async function(){
  const params = new URLSearchParams(location.search);
  const catParam = params.get('cat');
  const subParam = params.get('sub');

  const questionEl = document.getElementById('questionText');
  const answersList = document.getElementById('answersList');
  const progressEl = document.getElementById('quizProgress');
  const scoreEl = document.getElementById('quizScore');
  const nextBtn = document.getElementById('nextQuestionBtn');
  const restartBtn = document.getElementById('restartQuizBtn');
  const statusEl = document.getElementById('quizStatus');

  let allData = {};
  try { const res = await fetch('data/quiz_questions.json'); allData = await res.json(); }
  catch(e){ statusEl.textContent = 'Failed to load questions.'; console.error(e); return; }

  function getSelected(){
    let arr = [];
    if (catParam && subParam && allData[catParam] && Array.isArray(allData[catParam][subParam])) {
      arr = [...allData[catParam][subParam]];
    } else {
      statusEl.textContent = 'Invalid quiz selection.';
    }
    return arr;
  }

  const state = { questions: getSelected(), current: 0, score: 0 };
  if (!state.questions.length){ return; }

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }

  function renderQuestion(){
    const q = state.questions[state.current];
    questionEl.textContent = q.question;
    answersList.innerHTML='';
    const options = shuffle([...q.options]);
    options.forEach(opt => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleAnswer(btn, opt === q.answer));
      li.appendChild(btn);
      answersList.appendChild(li);
    });
    progressEl.textContent = `Question ${state.current+1} of ${state.questions.length}`;
    scoreEl.textContent = `Score: ${state.score}`;
    nextBtn.disabled = true;
  }

  function handleAnswer(btn, isCorrect){
    const q = state.questions[state.current];
    [...answersList.querySelectorAll('.answer-btn')].forEach(b => {
      b.disabled = true;
      if (b.textContent === q.answer) b.classList.add('correct');
    });
    if (isCorrect){ state.score++; btn.classList.add('correct'); statusEl.textContent='Correct!'; }
    else { btn.classList.add('incorrect'); statusEl.textContent='Not quite.'; }
    scoreEl.textContent = `Score: ${state.score}`;
    nextBtn.disabled = false;
  }

  function nextQuestion(){
    if (state.current < state.questions.length - 1){ state.current++; renderQuestion(); }
    else { statusEl.textContent = `Finished! Your score: ${state.score}/${state.questions.length}`; nextBtn.disabled = true; restartBtn.hidden = false; }
  }

  renderQuestion();
  nextBtn.addEventListener('click', nextQuestion);
  restartBtn.addEventListener('click', () => { state.current = 0; state.score = 0; renderQuestion(); statusEl.textContent=''; restartBtn.hidden = true; });
})();
