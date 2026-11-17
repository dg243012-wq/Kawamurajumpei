const SAVE_KEY = "novel_game_save_v3";
const TEXT_SPEED_MS = 30;

// テキストシナリオをプログラム用のデータに変換
function parseScenario(rawText) {
  const lines = rawText.split(/\r?\n/);
  const steps = [];
  const labels = {};

  let currentBg = "";
  let currentChara = "";
  let currentName = "";

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//")) continue; // 空行とコメントは無視

    // ラベル定義 (*label)
    if (line.startsWith("*")) {
      const labelName = line.slice(1).trim();
      labels[labelName] = steps.length;
      continue;
    }

    // 無条件ジャンプ (-> *label)
    if (line.startsWith("->")) {
      const target = line.slice(2).trim().replace(/^\*/, "");
      steps.push({ type: "jump", target });
      continue;
    }

    // 背景変更 (@bg name)
    if (line.startsWith("@bg ")) {
      currentBg = line.slice(4).trim();
      continue;
    }

    // キャラ変更 (@chara name)
    if (line.startsWith("@chara ")) {
      currentChara = line.slice(7).trim();
      continue;
    }

    // 名前変更 (# name)
    if (line === "#" || line.startsWith("# ")) {
      currentName = line.slice(1).trim();
      continue;
    }

    // 選択肢 (? label1 -> *target1 | label2 -> *target2)
    if (line.startsWith("?")) {
      const choiceStr = line.slice(1).trim();
      const choices = choiceStr.split("|").map(part => {
        const [label, targetRaw] = part.split("->");
        return {
          label: label ? label.trim() : "選択",
          target: targetRaw ? targetRaw.trim().replace(/^\*/, "") : ""
        };
      });

      // 直前のセリフに選択肢を紐づける
      const prevStep = steps[steps.length - 1];
      if (prevStep && prevStep.type === "say") {
        prevStep.choices = choices;
      } else {
        steps.push({
          type: "say",
          name: currentName,
          text: "",
          bg: currentBg,
          chara: currentChara,
          choices
        });
      }
      continue;
    }

    // それ以外はすべてセリフ行
    steps.push({
      type: "say",
      name: currentName,
      text: line,
      bg: currentBg,
      chara: currentChara,
      choices: null
    });
  }

  return { steps, labels };
}

const { steps: GAME_STEPS, labels: GAME_LABELS } = parseScenario(SCRIPT_TEXT);

let currentIndex = 0;
let displayedText = "";
let typingTimer = null;
let isTyping = false;
let isChoosing = false;
let historyLog = [];

const gameContainer = document.getElementById("game-container");
const bgImage = document.getElementById("bg-image");
const charaImage = document.getElementById("chara-image");
const choiceLayer = document.getElementById("choice-layer");
const nameBox = document.getElementById("name-box");
const charaName = document.getElementById("chara-name");
const messageText = document.getElementById("message-text");
const toast = document.getElementById("toast");
const logModal = document.getElementById("log-modal");
const logList = document.getElementById("log-list");

function resolveAsset(type, key) {
  if (!key) return "";
  if (GAME_ASSETS[type] && key in GAME_ASSETS[type]) {
    return GAME_ASSETS[type][key];
  }
  return key;
}

function renderChoices(choices) {
  isChoosing = true;
  choiceLayer.innerHTML = "";

  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn";
    btn.textContent = choice.label;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      historyLog.push({
        index: currentIndex,
        name: "【選択】",
        text: choice.label
      });
      hideChoices();
      jumpToLabel(choice.target);
    });

    choiceLayer.appendChild(btn);
  });

  choiceLayer.classList.remove("hidden");
}

function hideChoices() {
  isChoosing = false;
  choiceLayer.innerHTML = "";
  choiceLayer.classList.add("hidden");
}

function jumpToLabel(labelName) {
  if (!(labelName in GAME_LABELS)) {
    showToast(`飛び先「*${labelName}」が見つかりません`);
    return;
  }
  currentIndex = GAME_LABELS[labelName];
  renderStep(currentIndex);
}

function renderStep(index, skipTyping = false) {
  let guard = 0;
  while (GAME_STEPS[index] && GAME_STEPS[index].type === "jump") {
    const target = GAME_STEPS[index].target;
    if (!(target in GAME_LABELS) || guard > 50) {
      showToast(`飛び先「*${target}」が見つかりません`);
      return;
    }
    index = GAME_LABELS[target];
    currentIndex = index;
    guard++;
  }

  const step = GAME_STEPS[index];
  if (!step) {
    showToast("最後のセリフです");
    return;
  }

  hideChoices();

  // 背景更新
  const bgSrc = resolveAsset("bg", step.bg);
  if (bgSrc) bgImage.src = bgSrc;

  // 立ち絵更新
  const charaSrc = resolveAsset("chara", step.chara);
  if (charaSrc) {
    charaImage.src = charaSrc;
    charaImage.style.display = "block";
  } else {
    charaImage.style.display = "none";
  }

  // 名前更新
  if (step.name) {
    charaName.textContent = step.name;
    nameBox.classList.remove("hidden");
  } else {
    charaName.textContent = "";
    nameBox.classList.add("hidden");
  }

  // ログ追加
  const lastLog = historyLog[historyLog.length - 1];
  if (step.text && (!lastLog || lastLog.index !== index)) {
    historyLog.push({
      index: index,
      name: step.name || "",
      text: step.text
    });
  }

  const onTextComplete = () => {
    isTyping = false;
    if (step.choices && step.choices.length > 0) {
      renderChoices(step.choices);
    }
  };

  clearInterval(typingTimer);
  if (skipTyping || !step.text) {
    messageText.textContent = step.text;
    onTextComplete();
    return;
  }

  isTyping = true;
  displayedText = "";
  messageText.textContent = "";
  let charPos = 0;

  typingTimer = setInterval(() => {
    displayedText += step.text[charPos];
    messageText.textContent = displayedText;
    charPos++;

    if (charPos >= step.text.length) {
      clearInterval(typingTimer);
      onTextComplete();
    }
  }, TEXT_SPEED_MS);
}

function advance() {
  if (!logModal.classList.contains("hidden")) return;
  if (isChoosing) return;

  const step = GAME_STEPS[currentIndex];
  if (!step) return;

  if (isTyping) {
    clearInterval(typingTimer);
    messageText.textContent = step.text;
    isTyping = false;
    if (step.choices && step.choices.length > 0) {
      renderChoices(step.choices);
    }
    return;
  }

  if (currentIndex < GAME_STEPS.length - 1) {
    currentIndex++;
    renderStep(currentIndex);
  } else {
    showToast("最後のセリフです");
  }
}

let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 1800);
}

gameContainer.addEventListener("click", advance);
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    advance();
  }
});

document.getElementById("btn-save").addEventListener("click", (e) => {
  e.stopPropagation();
  const saveData = { currentIndex, historyLog };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  showToast("セーブしました");
});

document.getElementById("btn-load").addEventListener("click", (e) => {
  e.stopPropagation();
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    showToast("セーブデータがありません");
    return;
  }
  const saveData = JSON.parse(raw);
  currentIndex = saveData.currentIndex || 0;
  historyLog = saveData.historyLog || [];
  renderStep(currentIndex, true);
  showToast("ロードしました");
});

document.getElementById("btn-log").addEventListener("click", (e) => {
  e.stopPropagation();
  logList.innerHTML = historyLog.map(item => `
    <div class="log-item">
      <div class="log-name">${item.name || "（地の文）"}</div>
      <div class="log-text">${item.text}</div>
    </div>
  `).join("");
  logModal.classList.remove("hidden");
  logList.scrollTop = logList.scrollHeight;
});

document.getElementById("btn-close-log").addEventListener("click", (e) => {
  e.stopPropagation();
  logModal.classList.add("hidden");
});
logModal.addEventListener("click", (e) => {
  e.stopPropagation();
});

// 起動
renderStep(currentIndex);
