let questions = [];
let currentIndex = 0;
let draggedId = null;
let score = []; 
// Mảng lưu trữ trạng thái các khối đã thả của từng câu: [ [id1, id2, null], [idA, null], ... ]
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

// Khởi tạo STT 1-50
for (let i = 1; i <= 50; i++) {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = i;
  sttSelect.appendChild(opt);
}

async function init() {
  const res = await fetch("data/questions.json");
  const data = await res.json();

  questions = data.questions;
  // Khởi tạo mảng lưu câu trả lời trống cho mỗi câu hỏi
  userAnswers = questions.map(q => new Array(q.dropSlots).fill(null));
  score = new Array(questions.length).fill(0);
  
  currentIndex = 0;
  loadQuestion();
  attachButtons();
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

startBtn.addEventListener("click", () => {
  document.getElementById("studentInfo").style.display = "none";
  document.querySelector(".layout").style.display = "flex";
  document.getElementById("controls").style.display = "flex";
  timerEl.style.display = "block";
  init();
  startTimer();
});

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

/* ================= QUẢN LÝ CÂU HỎI ================*/

function loadQuestion() {
  const q = questions[currentIndex];
  questionTitle.textContent = q.title;
  counterText.textContent = `Câu ${currentIndex + 1} / ${questions.length}`;
  resultEl.textContent = "";

  nextBtn.textContent = currentIndex === questions.length - 1 ? "Hoàn thành »" : "Câu tiếp theo »";
  prevBtn.style.display = currentIndex === 0 ? "none" : "inline-block";

  renderOptions(q.options);
  renderDropzones(q.dropSlots);
}

function renderOptions(options) {
  optionsContainer.innerHTML = "";
  // Trộn ngẫu nhiên nhưng phải giữ ID để kiểm tra trạng thái
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

    // Kiểm tra xem khối này đã có trong userAnswers của câu hiện tại chưa
    if (userAnswers[currentIndex].includes(opt.id.toString())) {
        box.style.opacity = "0.25";
        box.style.pointerEvents = "none";
    }

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

function renderDropzones(count) {
  dropzonesContainer.innerHTML = "";
  const currentSavedArr = userAnswers[currentIndex];

  for (let i = 0; i < count; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.index = i;

    // Nếu đã có dữ liệu lưu trữ, vẽ lại khối lệnh trong ô
    const savedId = currentSavedArr[i];
    if (savedId) {
        const optionData = questions[currentIndex].options.find(o => o.id == savedId);
        if (optionData) {
            const clone = document.createElement("div");
            clone.className = "option-in-slot";
            clone.innerHTML = `<img src="${optionData.img}" alt="${optionData.label}">`;
            slot.appendChild(clone);
            slot.dataset.occupied = "1";
            slot.dataset.id = savedId;
        }
    }

    slot.addEventListener("dragover", e => { e.preventDefault(); slot.classList.add("hover"); });
    slot.addEventListener("dragleave", () => slot.classList.remove("hover"));

    slot.addEventListener("drop", e => {
      e.preventDefault();
      slot.classList.remove("hover");
      const id = e.dataTransfer.getData("text/plain") || draggedId;
      if (!id || slot.dataset.occupied === "1") return;

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

      // Lưu vào bộ nhớ tạm
      userAnswers[currentIndex][i] = id.toString();
    });

    // CLICK ĐỂ GỠ KHỐI LỆNH
    slot.addEventListener("click", () => {
        if (slot.dataset.occupied === "1") {
            const id = slot.dataset.id;
            const original = document.querySelector(`.option[data-id='${id}']`);
            if (original) {
                original.style.opacity = "1";
                original.style.pointerEvents = "all";
            }
            slot.innerHTML = "";
            delete slot.dataset.occupied;
            delete slot.dataset.id;
            userAnswers[currentIndex][i] = null;
        }
    });

    dropzonesContainer.appendChild(slot);
  }
}

function autoCheck() {
  const q = questions[currentIndex];
  const currentResponse = userAnswers[currentIndex];
  const correct = JSON.stringify(currentResponse) === JSON.stringify(q.answerOrder.map(String));
  score[currentIndex] = correct ? 1 : 0;
  return correct;
}

function showFinalResult() {
  const total = questions.length;
  const correctCount = score.filter(x => x === 1).length;
  const percent = Math.round((correctCount / total) * 100);

  document.querySelector(".layout").style.display = "none";
  document.getElementById("controls").style.display = "none";
  document.getElementById("timer").style.display = "none";

  questionTitle.textContent = "🎉 KẾT QUẢ BÀI LÀM";
  counterText.textContent = "";

  resultEl.innerHTML = `
    <div style="margin-top:30px; padding:24px; background:#f0f7ff; border-radius:14px; text-align:center; box-shadow:0 6px 18px rgba(0,0,0,0.08);">
      <div style="font-size:26px; font-weight:bold; color:#0b3a66;">Bạn làm đúng ${correctCount} / ${total} câu</div>
      <div style="font-size:20px; margin-top:10px;">👉 Đạt ${percent}%</div>
    </div>
  `;

  fetch(SHEET_URL, {
    method: "POST",
    mode: "no-cors", // Thêm để tránh lỗi CORS khi gửi tới Apps Script
    body: JSON.stringify({
      class: classSelect.value,
      stt: sttSelect.value,
      name: nameInput.value,
      correct: correctCount,
      total: total,
      percent: percent,
      timeLeft: timerEl.textContent
    })
  });
}

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
  autoCheck(); // Lưu lại câu hiện tại trước khi quay lui
  if (currentIndex > 0) {
    currentIndex--;
    loadQuestion();
  }
}

function attachButtons() {
  nextBtn.onclick = nextQuestion;
  prevBtn.onclick = prevQuestion;
  resetBtn.onclick = () => {
      userAnswers[currentIndex] = new Array(questions[currentIndex].dropSlots).fill(null);
      loadQuestion();
  };
}

checkStudentInfo();