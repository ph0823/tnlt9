let questions = [];
let currentIndex = 0;
let draggedId = null;
let score = []; 
// Mảng lưu trữ trạng thái các khối đã thả của từng câu: [ [id1, id2, null], ... ]
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

// Tạo danh sách STT 1-50
for (let i = 1; i <= 50; i++) {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = i;
  sttSelect.appendChild(opt);
}

// Hàm khởi tạo dữ liệu
async function init() {
  try {
    const res = await fetch("questions.json"); // Đảm bảo đúng đường dẫn file JSON của bạn
    const data = await res.json();
    questions = data.questions;

    // Khởi tạo bộ nhớ tạm cho câu trả lời và điểm số
    userAnswers = questions.map(q => new Array(q.dropSlots).fill(null));
    score = new Array(questions.length).fill(0);
    
    currentIndex = 0;
    loadQuestion();
    attachButtons();
  } catch (error) {
    console.error("Lỗi tải dữ liệu câu hỏi:", error);
  }
}

/* ================= QUẢN LÝ THÔNG TIN & TIMER ================*/

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
      alert("⏰ Hết thời gian! Bài đã được nộp tự động.");
      showFinalResult();
    }
  }, 1000);
}

function updateTimerText() {
  const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const sec = String(timeLeft % 60).padStart(2, "0");
  timerEl.textContent = `⏱ Thời gian còn lại: ${min}:${sec}`;
}

/* ================= RENDER GIAO DIỆN CÂU HỎI ================*/

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
  // Xáo trộn ngẫu nhiên danh sách khối lệnh
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

    // Nếu khối này đã nằm trong vùng thả của câu hiện tại, làm mờ nó
    if (userAnswers[currentIndex].includes(opt.id)) {
        box.style.opacity = "0.25";
        box.style.pointerEvents = "none";
    }

    box.addEventListener("dragstart", e => {
      draggedId = opt.id;
      e.dataTransfer.setData("text/plain", opt.id);
      // Làm mờ tạm thời khi đang kéo
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

    // Khôi phục khối lệnh nếu đã làm trước đó
    const savedId = currentSavedArr[i];
    if (savedId) {
        const optionData = questions[currentIndex].options.find(o => o.id === savedId);
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

      // KHẮC PHỤC LỖI HIỂN THỊ: Nhân bản và ép hiển thị
      const clone = original.cloneNode(true);
      clone.className = "option-in-slot";
      clone.draggable = false;
      clone.style.visibility = "visible"; // Đảm bảo không bị kế thừa 'hidden'
      clone.style.opacity = "1";
      
      slot.appendChild(clone);
      slot.dataset.occupied = "1";
      slot.dataset.id = id;

      // Cập nhật trạng thái khối gốc
      original.style.opacity = "0.25";
      original.style.pointerEvents = "none";

      // Lưu vào bộ nhớ tạm userAnswer
      userAnswers[currentIndex][i] = id;
    });

    // CLICK ĐỂ GỠ KHỐI LỆNH RA KHỎI VÙNG THẢ
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

/* ================= CHẤM ĐIỂM & GỬI KẾT QUẢ ================*/

function autoCheck() {
  const q = questions[currentIndex];
  const currentResponse = userAnswers[currentIndex];
  // So sánh mảng trả lời với mảng đáp án từ JSON
  const isCorrect = JSON.stringify(currentResponse) === JSON.stringify(q.answerOrder);
  score[currentIndex] = isCorrect ? 1 : 0;
  return isCorrect;
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

  // Gửi dữ liệu về Google Sheets
  fetch(SHEET_URL, {
    method: "POST",
    mode: "no-cors", 
    body: JSON.stringify({
      sheetName: "KQ",
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

/* ================= ĐIỀU KHIỂN NÚT BẤM ================*/

function nextQuestion() {
  autoCheck(); // Chấm câu hiện tại trước khi chuyển
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    loadQuestion();
  } else {
    showFinalResult();
  }
}

function prevQuestion() {
  autoCheck(); // Lưu lại trạng thái câu hiện tại
  if (currentIndex > 0) {
    currentIndex--;
    loadQuestion();
  }
}

function attachButtons() {
  nextBtn.onclick = nextQuestion;
  prevBtn.onclick = prevQuestion;
  resetBtn.onclick = () => {
      // Xóa toàn bộ lựa chọn của câu hiện tại
      userAnswers[currentIndex] = new Array(questions[currentIndex].dropSlots).fill(null);
      loadQuestion();
  };
}

// Khởi động kiểm tra thông tin ban đầu
checkStudentInfo();