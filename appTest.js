/* ================== BIẾN TOÀN CỤC ================== */
let questions = [];
let currentIndex = 0;
let draggedId = null;
let score = [];

const SHEET_URL = "https://script.google.com/macros/s/AKfycbzBEriua8S5b3yzj3Rf-EuhFiS_yVwjVavxZ7ZJDhwCWspQYxgr9G6XnYY4hGB4NRtw/exec";

const optionsContainer = document.getElementById("options");
const dropzonesContainer = document.getElementById("dropzones");
const questionTitle = document.getElementById("questionTitle");
const counterText = document.getElementById("counterText");
const resultEl = document.getElementById("result");

const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const resetBtn = document.getElementById("resetBtn");

/* ================== TẠO ĐỀ THEO CHỦ ĐỀ ================== */
function pickQuestionsByCD(allQuestions, config) {
  let result = [];

  for (const cd in config) {
    const need = config[cd];
    const pool = allQuestions.filter(q => q.cd === cd);
    const shuffled = pool.sort(() => Math.random() - 0.5);

    result = result.concat(shuffled.slice(0, need));
  }

  // Trộn toàn bộ đề
  return result.sort(() => Math.random() - 0.5);
}

/* ================== LOAD CÂU HỎI ================== */
async function init() {
  const res = await fetch("data/qtest.json");
  const data = await res.json();

  // 🔧 CẤU HÌNH SỐ CÂU THEO CHỦ ĐỀ
  const config = {
    cdHinh: 2,     // Chu vi – diện tích
    cdDaySo: 0,    // In / liệt kê dãy số
    cdTinhDS: 2   // Tính tổng dãy số
  };

  questions = pickQuestionsByCD(data.questions, config);
  currentIndex = 0;
  score = [];

  loadQuestion();
  attachButtons();
}

/* ================= THÔNG TIN HS + TIMER ================= */

const nameInput = document.getElementById("studentName");
const classSelect = document.getElementById("studentClass");
const sttSelect = document.getElementById("studentStt");
const startBtn = document.getElementById("startBtn");
const timerEl = document.getElementById("timer");

let timer = null;
let timeLeft = 15 * 60;

// Tạo STT
for (let i = 1; i <= 50; i++) {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = i;
  sttSelect.appendChild(opt);
}

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

nameInput.addEventListener("input", checkStudentInfo);
classSelect.addEventListener("change", checkStudentInfo);
sttSelect.addEventListener("change", checkStudentInfo);

/* ================= BẮT ĐẦU LÀM BÀI ================= */
startBtn.addEventListener("click", () => {
  document.getElementById("studentInfo").style.display = "none";
  document.querySelector(".layout").style.display = "flex";
  document.getElementById("controls").style.display = "flex";
  timerEl.style.display = "block";

  init();
  startTimer();
});

/* ================= TIMER ================= */
function startTimer() {
  updateTimerText();

  timer = setInterval(() => {
    timeLeft--;
    updateTimerText();

    if (timeLeft <= 0) {
      clearInterval(timer);
      autoCheck();
      alert("⏰ Hết thời gian! Bài đã được nộp.");
      showFinalResult();
    }
  }, 1000);
}

function updateTimerText() {
  const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const sec = String(timeLeft % 60).padStart(2, "0");
  timerEl.textContent = `⏱ Thời gian còn lại: ${min}:${sec}`;
}

/* ================= LOAD 1 CÂU ================= */
function loadQuestion() {
  const q = questions[currentIndex];

  questionTitle.textContent = q.title;
  counterText.textContent = `Câu ${currentIndex + 1} / ${questions.length}`;
  resultEl.textContent = "";

  nextBtn.textContent =
    currentIndex === questions.length - 1 ? "Hoàn thành »" : "Câu tiếp theo »";

  prevBtn.style.display = currentIndex === 0 ? "none" : "inline-block";

  renderOptions(q.options);
  renderDropzones(q.dropSlots);
}

/* ================= OPTIONS ================= */
function renderOptions(options) {
  optionsContainer.innerHTML = "";
  const shuffled = options.slice().sort(() => Math.random() - 0.5);

  shuffled.forEach(opt => {
    const box = document.createElement("div");
    box.className = "option";
    box.draggable = true;
    box.dataset.id = opt.id;

    const img = document.createElement("img");
    img.src = opt.img;
    img.alt = opt.label;
    box.appendChild(img);

    box.addEventListener("dragstart", e => {
      draggedId = opt.id;
      e.dataTransfer.setData("text/plain", opt.id);
      setTimeout(() => box.style.visibility = "hidden", 0);
    });

    box.addEventListener("dragend", () => {
      box.style.visibility = "visible";
      draggedId = null;
    });

    optionsContainer.appendChild(box);
  });
}

/* ================= DROPZONES ================= */
function renderDropzones(count) {
  dropzonesContainer.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";

    slot.addEventListener("dragover", e => {
      e.preventDefault();
      slot.classList.add("hover");
    });

    slot.addEventListener("dragleave", () => slot.classList.remove("hover"));

    slot.addEventListener("drop", e => {
      e.preventDefault();
      slot.classList.remove("hover");

      const id = e.dataTransfer.getData("text/plain") || draggedId;
      if (!id || slot.dataset.occupied) return;

      const original = document.querySelector(`.option[data-id='${id}']`);
      if (!original) return;

      const clone = original.cloneNode(true);
      clone.className = "option-in-slot";
      clone.draggable = false;

      slot.appendChild(clone);
      slot.dataset.occupied = "1";
      slot.dataset.id = id;

      original.style.opacity = "0.25";
      original.style.pointerEvents = "none";
    });

    dropzonesContainer.appendChild(slot);
  }
}

/* ================= CHẤM TỰ ĐỘNG ================= */
function autoCheck() {
  const q = questions[currentIndex];
  const slots = Array.from(document.querySelectorAll(".slot"));
  const dropped = slots.map(s => s.dataset.id || null);

  score[currentIndex] =
    JSON.stringify(dropped) === JSON.stringify(q.answerOrder) ? 1 : 0;
}

/* ================= KẾT QUẢ ================= */
function showFinalResult() {
  const total = questions.length;
  const correct = score.filter(x => x === 1).length;
  const percent = Math.round((correct / total) * 100);

  document.querySelector(".layout").style.display = "none";
  document.getElementById("controls").style.display = "none";
  timerEl.style.display = "none";

  questionTitle.textContent = "🎉 KẾT QUẢ BÀI LÀM";
  counterText.textContent = "";

  resultEl.innerHTML = `
    <div style="padding:24px;background:#f0f7ff;border-radius:14px;text-align:center">
      <h2>Đúng ${correct} / ${total} câu</h2>
      <h3>Đạt ${percent}%</h3>
    </div>
  `;

  fetch(SHEET_URL, {
    method: "POST",
    body: JSON.stringify({
      sheetName: "KQ",
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
function nextQuestion() {
  autoCheck();
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    loadQuestion();
  } else {
    showFinalResult();
  }
}

function prevQuestion() {
  if (currentIndex > 0) {
    currentIndex--;
    loadQuestion();
  }
}

function attachButtons() {
  nextBtn.onclick = nextQuestion;
  prevBtn.onclick = prevQuestion;
  resetBtn.onclick = loadQuestion;
}

checkStudentInfo();
