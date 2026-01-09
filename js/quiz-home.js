
(async function(){
  const categorySelect = document.getElementById('quizCategory');
  const subcategorySelect = document.getElementById('quizSubcategory');
  const startBtn = document.getElementById('goToIntroBtn');
  const statusEl = document.getElementById('quizStatus');

  let allData = {};
  try { const res = await fetch('data/quiz_questions.json'); allData = await res.json(); }
  catch(e){ statusEl.textContent = 'Failed to load questions.'; console.error(e); return; }

  function populateCategories(){
    categorySelect.innerHTML = '';
    Object.keys(allData).forEach(cat => { const opt = document.createElement('option'); opt.value = cat; opt.textContent = cat.replace(/_/g,' '); categorySelect.appendChild(opt); });
  }
  function populateSubcategories(cat){
    subcategorySelect.innerHTML = '';
    const subcats = Array.isArray(allData[cat]) ? [] : Object.keys(allData[cat] || {});
    subcats.forEach(sub => { const opt=document.createElement('option'); opt.value=sub; opt.textContent=sub.replace(/_/g,' '); subcategorySelect.appendChild(opt); });
  }

  populateCategories();
  populateSubcategories(categorySelect.value || Object.keys(allData)[0]);
  categorySelect.addEventListener('change', () => populateSubcategories(categorySelect.value));

  function introPath(cat, sub){ return `data/intro/${sub}.html`; }

  startBtn.addEventListener('click', () => {
    const cat = categorySelect.value; const sub = subcategorySelect.value;
    const path = introPath(cat, sub);
    window.location.href = path;
  });
})();
