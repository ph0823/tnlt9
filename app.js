let questions = [];
let currentIndex = 0;
let draggedId = null;
let score = []; // lưu điểm từng câu

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

/*-------------- TỔNG KẾT CUỐI BÀI ----------------*/
function showFinalResult() {
  const total = questions.length;
  const correct = score.filter(x => x === 1).length;
  const percent = Math.round((correct / total) * 100);

  // Ẩn giao diện làm bài
  optionsContainer.innerHTML = "";
  dropzonesContainer.innerHTML = "";
  document.getElementById("controls").style.display = "none";

  questionTitle.textContent = "KẾT QUẢ BÀI LÀM";
  counterText.textContent = "";

  resultEl.style.color = "#0b3a66";
  resultEl.innerHTML = `
    <div style="font-size:20px; font-weight:bold; margin-top:20px;">
      Bạn làm đúng ${correct}/${total} câu (${percent}%)
    </div>
  `;
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

init();
