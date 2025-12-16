let questions = [];
let currentIndex = 0;
let draggedId = null;
let score = []; // lưu điểm từng câu

const SHEET_URL = "https://script.google.com/macros/s/AKfycbzBEriua8S5b3yzj3Rf-EuhFiS_yVwjVavxZ7ZJDhwCWspQYxgr9G6XnYY4hGB4NRtw/exec"
const optionsContainer = document.getElementById("options");
const dropzonesContainer = document.getElementById("dropzones");
const questionTitle = document.getElementById("questionTitle");
const counterText = document.getElementById("counterText");
const resultEl = document.getElementById("result");

const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const resetBtn = document.getElementById("resetBtn");

async function init() {
  const res = await fetch("data/questions.json");
  const data = await res.json();

  questions = data.questions;
  currentIndex = 0;

  loadQuestion();
  attachButtons();
}

/* ================= THÔNG TIN HỌC SINH + TIMER ================= */

const nameInput = document.getElementById("studentName");
const classSelect = document.getElementById("studentClass");
const sttSelect = document.getElementById("studentStt");
const startBtn = document.getElementById("startBtn");
const timerEl = document.getElementById("timer");

let timer = null;
let timeLeft = 15 * 60; // 15 phút

// Tạo STT từ 1 -> 50
for (let i = 1; i <= 50; i++) {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = i;
  sttSelect.appendChild(opt);
}

// Kiểm tra đủ thông tin chưa
function checkStudentInfo() {
  // Chưa chọn lớp
  if (!classSelect.value) {
    sttSelect.disabled = true;
    nameInput.disabled = true;
    startBtn.style.display = "none";
    return;
  }

  // Đã chọn lớp → cho chọn STT
  sttSelect.disabled = false;

  // Chưa chọn STT
  if (!sttSelect.value) {
    nameInput.disabled = true;
    startBtn.style.display = "none";
    return;
  }

  // Đã chọn STT → cho nhập tên
  nameInput.disabled = false;

  // Chưa nhập tên
  if (nameInput.value.trim().length < 3) {
    startBtn.style.display = "none";
    return;
  }

  // ĐỦ THÔNG TIN
  startBtn.style.display = "inline-block";
}




nameInput.addEventListener("input", checkStudentInfo);
classSelect.addEventListener("change", checkStudentInfo);
sttSelect.addEventListener("change", checkStudentInfo);

// ----------------- BẮT ĐẦU LÀM BÀI --------------------------------
startBtn.addEventListener("click", () => {
  // Ẩn form thông tin
  document.getElementById("studentInfo").style.display = "none";

  // Hiện khu làm bài
  document.querySelector(".layout").style.display = "flex";
  document.getElementById("controls").style.display = "flex";
  timerEl.style.display = "block";

  // BẮT ĐẦU LOAD CÂU HỎI
  init();

  // BẮT ĐẦU TÍNH GIỜ
  startTimer();
});


// ĐẾM NGƯỢC 15 PHÚT
function startTimer() {
  updateTimerText();

  timer = setInterval(() => {
    timeLeft--;
    updateTimerText();

    if (timeLeft <= 0) {
      clearInterval(timer);

      // ✅ TỰ CHẤM CÂU HIỆN TẠI
      autoCheck();

      alert("⏰ Hết thời gian! Bài đã được nộp.");

      // ✅ HIỂN THỊ KẾT QUẢ
      showFinalResult();
    }
  }, 1000);
}

function updateTimerText() {
  const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const sec = String(timeLeft % 60).padStart(2, "0");
  timerEl.textContent = `⏱ Thời gian còn lại: ${min}:${sec}`;
}

/* ================= load câu hỏi ================*/

function loadQuestion() {
  const q = questions[currentIndex];

  questionTitle.textContent = q.title;
  counterText.textContent = `Câu ${currentIndex + 1} / ${questions.length}`;
  resultEl.textContent = "";

  nextBtn.textContent = currentIndex === questions.length - 1
    ? "Hoàn thành »"
    : "Câu tiếp theo »";

  prevBtn.style.display = currentIndex === 0 ? "none" : "inline-block";

  renderOptions(q.options);
  renderDropzones(q.dropSlots);
}

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

function renderDropzones(count) {
  dropzonesContainer.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.index = i;

    slot.addEventListener("dragover", e => {
      e.preventDefault();
      slot.classList.add("hover");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("hover"));

    slot.addEventListener("drop", e => {
      e.preventDefault();
      slot.classList.remove("hover");

      const id = e.dataTransfer.getData("text/plain") || draggedId;
      if (!id) return;

      if (slot.dataset.occupied === "1") return;

      const original = document.querySelector(`.option[data-id='${id}']`);
      if (!original) return;

      const clone = original.cloneNode(true);
      clone.className = "option-in-slot";
      clone.draggable = false;
      clone.style.visibility = "visible";

      slot.appendChild(clone);

      slot.dataset.occupied = "1";
      slot.dataset.id = id;

      original.style.opacity = "0.25";
      original.style.pointerEvents = "none";
    });

    dropzonesContainer.appendChild(slot);
  }
}

/*-------------- AUTO CHẤM KHI BẤM "CÂU TIẾP THEO" ----------------*/
function autoCheck() {
  const q = questions[currentIndex];
  const slots = Array.from(document.querySelectorAll(".slot"));
  const dropped = slots.map(s => s.dataset.id || null);

  const correct = JSON.stringify(dropped) === JSON.stringify(q.answerOrder);
  score[currentIndex] = correct ? 1 : 0;

  return correct;
}

/*-------------- CHẤM VÀ HIỆN THÔNG BÁO ----------------*/
function showFinalResult() {
  const total = questions.length;
  const correct = score.filter(x => x === 1).length;
  const percent = Math.round((correct / total) * 100);

  document.querySelector(".layout").style.display = "none";
  document.getElementById("controls").style.display = "none";
  document.getElementById("timer").style.display = "none";

  questionTitle.textContent = "🎉 KẾT QUẢ BÀI LÀM";
  counterText.textContent = "";

  resultEl.innerHTML = `
    <div style="
      margin-top:30px;
      padding:24px;
      background:#f0f7ff;
      border-radius:14px;
      text-align:center;
      box-shadow:0 6px 18px rgba(0,0,0,0.08);
    ">
      <div style="font-size:26px; font-weight:bold; color:#0b3a66;">
        Bạn làm đúng ${correct} / ${total} câu
      </div>

      <div style="font-size:20px; margin-top:10px;">
        👉 Đạt ${percent}%
      </div>

      <div style="margin-top:16px; font-size:15px; color:#444;">
        ⏱ Bài làm được nộp khi hết giờ hoặc bấm “Hoàn thành”
      </div>
    </div>
  `;

  // ===== GỬI KẾT QUẢ VỀ GOOGLE SHEET =====
  fetch(SHEET_URL, {
    method: "POST",
    body: JSON.stringify({
      class: classSelect.value,
      stt: sttSelect.value,
      name: nameInput.value,
      correct: correct,
      total: total,
      percent: percent,
      timeLeft: timerEl.textContent
    })
  });

}



/*-------------- NÚT ĐIỀU KHIỂN ----------------*/
function nextQuestion() {
  autoCheck(); // tự chấm

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

/*-------------- GẮN NÚT ----------------*/
function attachButtons() {
  nextBtn.addEventListener("click", nextQuestion);
  prevBtn.addEventListener("click", prevQuestion);
  resetBtn.addEventListener("click", loadQuestion);
}

checkStudentInfo();

