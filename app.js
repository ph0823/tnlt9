let questions = [];
let currentIndex = 0;
let draggedId = null;
let score = [];
let userAnswers = [];

const SHEET_URL = "https://script.google.com/macros/s/AKfycbzBEriua8S5b3yzj3Rf-EuhFiS_yVwjVavxZ7ZJDhwCWspQYxgr9G6XnYY4hGB4NRtw/exec";

const optionsContainer = document.getElementById("options");
const dropzonesContainer = document.getElementById("dropzones");
const questionTitle = document.getElementById("questionTitle");
const counterText = document.getElementById("counterText");
const resultEl = document.getElementById("result");

const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const resetBtn = document.getElementById("resetBtn");

const nameInput = document.getElementById("studentName");
const classSelect = document.getElementById("studentClass");
const sttSelect = document.getElementById("studentStt");
const startBtn = document.getElementById("startBtn");
const timerEl = document.getElementById("timer");

let timer = null;
let timeLeft = 15 * 60;

/* ================= KHỞI TẠO ================= */

for (let i = 1; i <= 50; i++) {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = i;
  sttSelect.appendChild(opt);
}

async function init() {
  const res = await fetch("questions.json");
  const data = await res.json();
  questions = data.questions;

  userAnswers = questions.map(q => new Array(q.dropSlots).fill(null));
  score = new Array(questions.length).fill(0);

  currentIndex = 0;
  loadQuestion();
  attachButtons();
}

/* ================= TIMER ================= */

function startTimer() {
  updateTimer();
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(timer);
      checkAllQuestions();
      alert("⏰ Hết thời gian! Bài đã được nộp.");
      showFinalResult();
    }
  }, 1000);
}

function updateTimer() {
  const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const s = String(timeLeft % 60).padStart(2, "0");
  timerEl.textContent = `⏱ ${m}:${s}`;
}

/* ================= RENDER ================= */

function loadQuestion() {
  const q = questions[currentIndex];
  questionTitle.textContent = q.title;
  counterText.textContent = `Câu ${currentIndex + 1}/${questions.length}`;
  resultEl.textContent = "";

  prevBtn.style.display = currentIndex === 0 ? "none" : "inline-block";
  nextBtn.textContent =
    currentIndex === questions.length - 1 ? "Hoàn thành »" : "Câu tiếp theo »";

  renderOptions(q.options);
  renderDropzones(q.dropSlots);
}

function renderOptions(options) {
  optionsContainer.innerHTML = "";

  options
    .slice()
    .sort(() => Math.random() - 0.5)
    .forEach(opt => {
      const box = document.createElement("div");
      box.className = "option";
      box.draggable = true;
      box.dataset.id = opt.id;

      box.innerHTML = `<img src="${opt.img}" alt="${opt.label}">`;

      if (userAnswers[currentIndex].includes(opt.id)) {
        box.style.opacity = "0.3";
        box.style.pointerEvents = "none";
      }

      box.addEventListener("dragstart", e => {
        draggedId = opt.id;
        e.dataTransfer.setData("text/plain", opt.id);
        setTimeout(() => (box.style.visibility = "hidden"), 0);
      });

      box.addEventListener("dragend", () => {
        box.style.visibility = "visible";
      });

      optionsContainer.appendChild(box);
    });
}

function renderDropzones(count) {
  dropzonesContainer.innerHTML = "";
  const saved = userAnswers[currentIndex];

  for (let i = 0; i < count; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";

    if (saved[i]) {
      const opt = questions[currentIndex].options.find(o => o.id === saved[i]);
      slot.innerHTML = `<div class="option-in-slot"><img src="${opt.img}"></div>`;
      slot.dataset.id = saved[i];
      slot.dataset.occupied = "1";
    }

    slot.addEventListener("dragover", e => e.preventDefault());

    slot.addEventListener("drop", e => {
      e.preventDefault();
      if (slot.dataset.occupied) return;

      const id = e.dataTransfer.getData("text/plain") || draggedId;
      const original = document.querySelector(`.option[data-id="${id}"]`);
      if (!original) return;

      slot.innerHTML = original.innerHTML;
      slot.dataset.id = id;
      slot.dataset.occupied = "1";

      original.style.opacity = "0.3";
      original.style.pointerEvents = "none";

      userAnswers[currentIndex][i] = id;
    });

    slot.addEventListener("click", () => {
      if (!slot.dataset.occupied) return;
      const id = slot.dataset.id;
      const original = document.querySelector(`.option[data-id="${id}"]`);
      if (original) {
        original.style.opacity = "1";
        original.style.pointerEvents = "all";
      }
      slot.innerHTML = "";
      delete slot.dataset.occupied;
      delete slot.dataset.id;
      userAnswers[currentIndex][i] = null;
    });

    dropzonesContainer.appendChild(slot);
  }
}

/* ================= CHẤM ĐIỂM THEO LOGIC ================= */

function isLogicCorrect(userArr, answerArr) {
  const u = userArr.filter(Boolean);
  if (u.length !== answerArr.length) return false;

  // đúng tập khối
  const sameSet =
    u.every(x => answerArr.includes(x)) &&
    answerArr.every(x => u.includes(x));
  if (!sameSet) return false;

  // kiểm tra thứ tự tương đối
  for (let i = 0; i < answerArr.length - 1; i++) {
    const a = answerArr[i];
    const b = answerArr[i + 1];
    if (u.indexOf(a) > u.indexOf(b)) return false;
  }

  return true;
}

function checkAllQuestions() {
  questions.forEach((q, i) => {
    score[i] = isLogicCorrect(userAnswers[i], q.answerOrder) ? 1 : 0;
  });
}

/* ================= KẾT QUẢ ================= */

function showFinalResult() {
  const correct = score.filter(x => x).length;
  const total = questions.length;
  const percent = Math.round((correct / total) * 100);

  document.querySelector(".layout").style.display = "none";
  document.getElementById("controls").style.display = "none";
  timerEl.style.display = "none";

  questionTitle.textContent = "🎉 KẾT QUẢ";
  resultEl.innerHTML = `
    <div style="padding:24px;background:#e8f3ff;border-radius:14px">
      <h2>${correct}/${total} câu đúng</h2>
      <p>Đạt ${percent}%</p>
    </div>
  `;

  fetch(SHEET_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({
      class: classSelect.value,
      stt: sttSelect.value,
      name: nameInput.value,
      correct,
      total,
      percent
    })
  });
}

/* ================= NÚT ================= */

function attachButtons() {
  nextBtn.onclick = () => {
    if (currentIndex < questions.length - 1) {
      currentIndex++;
      loadQuestion();
    } else {
      checkAllQuestions();
      showFinalResult();
    }
  };

  prevBtn.onclick = () => {
    if (currentIndex > 0) {
      currentIndex--;
      loadQuestion();
    }
  };

  resetBtn.onclick = () => {
    userAnswers[currentIndex] = new Array(questions[currentIndex].dropSlots).fill(null);
    loadQuestion();
  };
}

/* ================= THÔNG TIN HỌC SINH ================= */

function checkStudentInfo() {
  if (!classSelect.value) {
    sttSelect.disabled = true;
    nameInput.disabled = true;
    startBtn.style.display = "none";
    return;
  }

  sttSelect.disabled = false;

  if (!sttSelect.value) {
    nameInput.disabled = true;
    startBtn.style.display = "none";
    return;
  }

  nameInput.disabled = false;

  if (nameInput.value.trim().length < 3) {
    startBtn.style.display = "none";
    return;
  }

  startBtn.style.display = "inline-block";
}

classSelect.addEventListener("change", checkStudentInfo);
sttSelect.addEventListener("change", checkStudentInfo);
nameInput.addEventListener("input", checkStudentInfo);

// chạy kiểm tra ban đầu
checkStudentInfo();

/* ================= START ================= */

startBtn.onclick = () => {
  document.getElementById("studentInfo").style.display = "none";
  document.querySelector(".layout").style.display = "flex";
  document.getElementById("controls").style.display = "flex";
  timerEl.style.display = "block";
  init();
  startTimer();
};