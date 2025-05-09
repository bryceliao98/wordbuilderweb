// ——— State ——————————————————————————————————
const state = {
  vocab: [],
  stageSize: 10,
  level: 1,
  timeLimit: 10,
  stageStart: 0,
  stageWords: [],
  remainingWords: [],
  correctAnswer: '',
  mistakes: [],
  timer: null,
  timeRemaining: 0
};

// ——— Setup View Elements —————————————————————
const csvInput = document.getElementById('csvInput');
const wordCount = document.getElementById('wordCount');
const levelSelect = document.getElementById('levelSelect');
const stageSizeInput = document.getElementById('stageSizeInput');
const stageSizeLabel = document.getElementById('stageSizeLabel');
const timeLimitInput = document.getElementById('timeLimitInput');
const timeLimitLabel = document.getElementById('timeLimitLabel');
const startBtn = document.getElementById('startBtn');

const setupView = document.getElementById('setup-view');
const quizView = document.getElementById('quiz-view');
const summaryView = document.getElementById('summary-view');

const levelLabel = document.getElementById('levelLabel');
const timerLabel = document.getElementById('timerLabel');
const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const summaryList = document.getElementById('summaryList');
const nextLevelBtn = document.getElementById('nextLevelBtn');

// ——— Helpers —————————————————————————————————
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function showView(view) {
  setupView.style.display = view==='setup' ? '' : 'none';
  quizView.style.display = view==='quiz' ? '' : 'none';
  summaryView.style.display = view==='summary' ? '' : 'none';
}

// ——— CSV Loading —————————————————————————
csvInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    const lines = evt.target.result.split('\n');
    state.vocab = lines
      .map(l => l.trim().split(',',2))
      .filter(p => p.length===2 && p[0] && p[1])
      .map(([s,t])=>({source:s, target:t}));
    wordCount.textContent = state.vocab.length;
    startBtn.disabled = state.vocab.length===0;
  };
  reader.readAsText(file);
});

// ——— Setup Controls ————————————————————————
stageSizeInput.addEventListener('input', () => {
  state.stageSize = +stageSizeInput.value;
  stageSizeLabel.textContent = state.stageSize;
});
timeLimitInput.addEventListener('input', () => {
  state.timeLimit = +timeLimitInput.value;
  timeLimitLabel.textContent = state.timeLimit;
});
levelSelect.addEventListener('change', () => {
  state.level = +levelSelect.value;
});

// ——— Start Game —————————————————————————
startBtn.addEventListener('click', () => {
  state.stageStart = 0;
  state.mistakes = [];
  setupStage();
  nextQuestion();
  showView('quiz');
});

function setupStage() {
  const end = Math.min(state.stageStart + state.stageSize, state.vocab.length);
  state.stageWords = state.vocab.slice(state.stageStart, end);
  shuffle(state.stageWords);
  state.remainingWords = [...state.stageWords];
}

// ——— Quiz Flow —————————————————————————
function nextQuestion() {
  clearInterval(state.timer);
  if (state.remainingWords.length === 0) {
    showSummary();
    return;
  }
  const item = state.remainingWords.shift();
  makeQuestion(item);
  restartTimer();
}

function makeQuestion(item) {
  let pool;
  switch(state.level) {
    case 1:
      questionEl.textContent = item.source;
      state.correctAnswer = item.target;
      pool = state.vocab.map(v=>v.target);
      break;
    case 2:
      questionEl.textContent = item.target;
      state.correctAnswer = item.source;
      pool = state.vocab.map(v=>v.source);
      break;
    case 3:
      if (Math.random()<0.5) {
        questionEl.textContent = item.source;
        state.correctAnswer = item.target;
        pool = state.vocab.map(v=>v.target);
      } else {
        questionEl.textContent = item.target;
        state.correctAnswer = item.source;
        pool = state.vocab.map(v=>v.source);
      }
      break;
  }
  buildOptions(pool);
  levelLabel.textContent = levelSelect.options[state.level-1].text;
}

function buildOptions(pool) {
  const set = new Set([state.correctAnswer]);
  while (set.size < 3) {
    set.add(pool[Math.floor(Math.random()*pool.length)]);
  }
  const opts = shuffle([...set]);
  optionsEl.innerHTML = '';
  opts.forEach((opt,i) => {
    const btn = document.createElement('button');
    btn.textContent = `${i+1}. ${opt}`;
    btn.onclick = () => choose(opt);
    document.addEventListener('keypress', function keyHandler(e) {
      if (e.key === String(i+1)) choose(opt);
    }, { once: true });
    optionsEl.appendChild(btn);
  });
}

function restartTimer() {
  state.timeRemaining = state.timeLimit;
  timerLabel.textContent = `⏱ ${state.timeRemaining}s`;
  state.timer = setInterval(() => {
    state.timeRemaining--;
    timerLabel.textContent = `⏱ ${state.timeRemaining}s`;
    if (state.timeRemaining<=0) {
      clearInterval(state.timer);
      recordMistake(null, true);
      alert('❌ Time up');
      nextQuestion();
    }
  }, 1000);
}

function choose(answer) {
  clearInterval(state.timer);
  const correct = answer === state.correctAnswer;
  if (!correct) recordMistake(answer, false);
  alert(correct ? '✅ Correct' : `❌ Wrong\nAnswer: ${state.correctAnswer}`);
  nextQuestion();
}

function recordMistake(given, timedOut) {
  state.mistakes.push({
    prompt: questionEl.textContent,
    expected: state.correctAnswer,
    given,
    timedOut
  });
}

// ——— Summary —————————————————————————
function showSummary() {
  summaryList.innerHTML = '';
  if (state.mistakes.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'Perfect! No mistakes 🎉';
    summaryList.appendChild(p);
  } else {
    state.mistakes.forEach(m => {
      const div = document.createElement('div');
      div.className = 'summary-item';
      div.innerHTML = `
        <strong>Q:</strong> ${m.prompt}<br>
        <small>✅ ${m.expected}</small><br>
        <small>${m.timedOut ? '⏰ Time-out' : `❌ ${m.given}`}</small>
      `;
      summaryList.appendChild(div);
    });
  }
  showView('summary');
}

nextLevelBtn.addEventListener('click', () => {
  showView('setup');
});
