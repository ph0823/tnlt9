let questions = [];
let currentQuestion = null;
let dropOrder = [];

async function loadQuestions() {
    const res = await fetch("data/questions.json");
    const data = await res.json();
    questions = data.questions;
    currentQuestion = questions[0];
    renderQuestion();
}

function renderQuestion() {
    document.getElementById("qtext").innerText = currentQuestion.question;
    document.getElementById("question-image").src = currentQuestion.image;

    const optionsDiv = document.getElementById("options");
    optionsDiv.innerHTML = "";

    currentQuestion.options.forEach(opt => {
        const item = document.createElement("div");
        item.className = "option-item";

        const img = document.createElement("img");
        img.src = opt.img;
        img.draggable = true;
        img.dataset.id = opt.id;

        img.addEventListener("dragstart", dragStart);

        item.appendChild(img);
        optionsDiv.appendChild(item);
    });

    const dropzone = document.getElementById("dropzone");
    dropzone.innerHTML = "";
    dropzone.addEventListener("dragover", dragOver);
    dropzone.addEventListener("drop", dropDrop);

    dropOrder = [];
}

function dragStart(e) {
    e.dataTransfer.setData("id", e.target.dataset.id);
}

function dragOver(e) {
    e.preventDefault();
}

function dropDrop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData("id");

    const opt = currentQuestion.options.find(o => o.id === id);

    const img = document.createElement("img");
    img.src = opt.img;

    document.getElementById("dropzone").appendChild(img);
    dropOrder.push(id);
}

document.getElementById("submit").addEventListener("click", () => {
    const correct = JSON.stringify(dropOrder) === JSON.stringify(currentQuestion.answer);
    document.getElementById("result").innerText = correct ? "✔ Chính xác!" : "✘ Sai rồi!";
});

loadQuestions();
