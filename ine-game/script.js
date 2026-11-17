const SAVE_KEY = "novel_game_save_v2";
const TEXT_SPEED_MS = 30;

let currentScene = "start";
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

// アセット名または直接パスから画像URLを取得
function resolveAsset(type, key) {
  if (!key) return "";
  if (GAME_ASSETS[type] && key in GAME_ASSETS[type]) {
    return GAME_ASSETS[type][key];
  }
  return key;
}

// 選択肢ボタンを表示
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
      // 選んだ選択肢をバックログに記録
      historyLog.push({
        scene: currentScene,
        index: currentIndex,
        name: "【選択】",
        text: choice.label
      });
      hideChoices();
      jumpToScene(choice.next);
    });

    choiceLayer.appendChild(btn);
  });

  choiceLayer.classList.remove("hidden");
}

// 選択肢を隠す
function hideChoices() {
  isChoosing = false;
  choiceLayer.innerHTML = "";
  choiceLayer.classList.add("hidden");
}

// 指定した場面の最初から再生
function jumpToScene(sceneName) {
  if (!GAME_SCENARIO[sceneName]) {
    showToast(`場面「${sceneName}」が見つかりません`);
    return;
  }
  currentScene = sceneName;
  currentIndex = 0;
  renderStep(currentScene, currentIndex);
}

// 1行分の描画
function renderStep(sceneName, index, skipTyping = false) {
  const sceneList = GAME_SCENARIO[sceneName];
  if (!sceneList || !sceneList[index]) return;

  const step = sceneList[index];
  hideChoices();

  // 背景の更新
  const bgSrc = resolveAsset("bg", step.bg);
  if (bgSrc) bgImage.src = bgSrc;

  // 立ち絵の更新
  const charaSrc = resolveAsset("chara", step.chara);
  if (charaSrc) {
    charaImage.src = charaSrc;
    charaImage.style.display = "block";
  } else {
    charaImage.style.display = "none";
  }

  // 名前の更新
  if (step.name) {
    charaName.textContent = step.name;
    nameBox.classList.remove("hidden");
  } else {
    charaName.textContent = "";
    nameBox.classList.add("hidden");
  }

  // バックログへ追加（重複防止）
  const lastLog = historyLog[historyLog.length - 1];
  if (!lastLog || lastLog.scene !== sceneName || lastLog.index !== index) {
    historyLog.push({
      scene: sceneName,
      index: index,
      name: step.name || "",
      text: step.text
    });
  }

  // テキスト表示完了後の処理
  const onTextComplete = () => {
    isTyping = false;
    if (step.choices && step.choices.length > 0) {
      renderChoices(step.choices);
    }
  };

  // タイプライター表示
  clearInterval(typingTimer);
  if (skipTyping) {
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

// 次の行へ進む処理
function advance() {
  if (!logModal.classList.contains("hidden")) return;
  if (isChoosing) return; // 選択肢表示中は画面クリックで進めない

  const sceneList = GAME_SCENARIO[currentScene];
  const step = sceneList[currentIndex];

  if (isTyping) {
    clearInterval(typingTimer);
    messageText.textContent = step.text;
    isTyping = false;
    if (step.choices && step.choices.length > 0) {
      renderChoices(step.choices);
    }
    return;
  }

  // 現在の場面に次の行があれば進む
  if (currentIndex < sceneList.length - 1) {
    currentIndex++;
    renderStep(currentScene, currentIndex);
  } else if (step.next) {
    // 場面の最後で next が指定されていれば次の場面へ移動
    jumpToScene(step.next);
  } else {
    showToast("最後のセリフです");
  }
}

// トースト通知
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 1800);
}

// クリック・キー操作
gameContainer.addEventListener("click", advance);
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    advance();
  }
});

// save ボタン
document.getElementById("btn-save").addEventListener("click", (e) => {
  e.stopPropagation();
  const saveData = {
    currentScene,
    currentIndex,
    historyLog
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  showToast("セーブしました");
});

// Load ボタン
document.getElementById("btn-load").addEventListener("click", (e) => {
  e.stopPropagation();
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    showToast("セーブデータがありません");
    return;
  }
  const saveData = JSON.parse(raw);
  if (!saveData.currentScene || !GAME_SCENARIO[saveData.currentScene]) {
    showToast("セーブデータを読み込めませんでした");
    return;
  }
  currentScene = saveData.currentScene;
  currentIndex = saveData.currentIndex || 0;
  historyLog = saveData.historyLog || [];
  renderStep(currentScene, currentIndex, true);
  showToast("ロードしました");
});

// log ボタン
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

// ログを閉じる
document.getElementById("btn-close-log").addEventListener("click", (e) => {
  e.stopPropagation();
  logModal.classList.add("hidden");
});
logModal.addEventListener("click", (e) => {
  e.stopPropagation();
});

// 初期起動
renderStep(currentScene, currentIndex);
