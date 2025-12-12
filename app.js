let q = null;
let optionsContainer = document.getElementById("options");
let dropzonesContainer = document.getElementById("dropzones");
let resultEl = document.getElementById("result");
let draggedId = null;

async function init() {
  const res = await fetch("data/questions.json");
  const data = await res.json();
  q = data.questions[0];
  renderOptions(q.options);
  renderDropzones(q.dropSlots);
  attachButtons();
}

function renderOptions(opts) {
  optionsContainer.innerHTML = "";
  const shuffled = opts.slice().sort(() => Math.random() - 0.5);

  shuffled.forEach(o => {
    const d = document.createElement("div");
    d.className = "option";
    d.draggable = true;
    d.dataset.id = o.id;

    const img = document.createElement("img");
    img.src = o.img;
    img.alt = o.label;
    d.appendChild(img);

    d.addEventListener("dragstart", e => {
      draggedId = o.id;
      e.dataTransfer.setData("text/plain", o.id);
      setTimeout(()=> d.style.visibility = "hidden", 0);
    });

    d.addEventListener("dragend", () => {
      const el = document.querySelector(`.option[data-id='${o.id}']`);
      if (el) el.style.visibility = "visible";
      draggedId = null;
    });

    optionsContainer.appendChild(d);
  });
}

function renderDropzones(n) {
  dropzonesContainer.innerHTML = "";

  for (let i = 0; i < n; i++) {
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

      const optDiv = document.querySelector(`.option[data-id='${id}']`);
      if (!optDiv) return;

      const clone = optDiv.cloneNode(true);
      clone.style.visibility = "visible";
      clone.draggable = false;
      clone.className = "option-in-slot";
      clone.style.width = "100%"; // giãn đầy chiều rộng
      slot.appendChild(clone);

      slot.dataset.occupied = "1";
      slot.dataset.id = id;

      optDiv.style.opacity = "0.25";
      optDiv.style.pointerEvents = "none";
    });

    dropzonesContainer.appendChild(slot);
  }
}

function attachButtons() {
  document.getElementById("checkBtn").addEventListener("click", checkAnswer);
  document.getElementById("resetBtn").addEventListener("click", resetAll);
}

function checkAnswer() {
  const slots = Array.from(document.querySelectorAll(".slot"));
  const dropped = slots.map(s => s.dataset.id || null);

  const expected = q.answerOrder;
  const ok = JSON.stringify(dropped) === JSON.stringify(expected);

  if (ok) {
    resultEl.style.color = "green";
    resultEl.textContent = "✔ Chính xác — thứ tự đúng!";
  } else {
    resultEl.style.color = "crimson";
    resultEl.textContent =
      "✘ Sai — thử lại. (Bạn thả: " +
      dropped.map(x => x || "-").join(", ") +
      ")";
  }
}

function resetAll() {
  document.querySelectorAll(".slot").forEach(s => {
    s.innerHTML = "";
    s.dataset.occupied = "0";
    s.dataset.id = "";
  });

  document.querySelectorAll(".option").forEach(o => {
    o.style.opacity = "1";
    o.style.pointerEvents = "auto";
    o.style.visibility = "visible";
  });

  resultEl.textContent = "";
}

init();
