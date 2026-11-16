// ==========================================
// 1. 仮画像データ（実際の画像を用意するまでのダミー）
// ==========================================
const DUMMY_BG = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#38a3ff"/>
      <stop offset="100%" stop-color="#bce6ff"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#sky)"/>
  <circle cx="620" cy="240" r="95" fill="#fff" opacity="0.9"/>
  <circle cx="710" cy="260" r="110" fill="#fff" opacity="0.9"/>
  <circle cx="530" cy="270" r="75" fill="#fff" opacity="0.9"/>
  <rect x="0" y="0" width="340" height="520" fill="#f2df8d"/>
  <polygon points="0,0 340,0 380,120 340,520 0,520" fill="#e6cf73"/>
  <rect x="0" y="340" width="330" height="320" fill="#a8a8a8"/>
  <rect x="1020" y="120" width="260" height="450" fill="#f7e5d2"/>
  <polygon points="940,140 1280,0 1280,140" fill="#465985"/>
  <rect x="820" y="330" width="460" height="160" fill="#a87654"/>
  <rect x="820" y="480" width="460" height="240" fill="#8f8f8f"/>
  <rect x="990" y="0" width="36" height="720" fill="#9e9e9e" transform="rotate(-5 1000 360)"/>
  <ellipse cx="970" cy="210" rx="22" ry="65" fill="#ff7b29" stroke="#ddd" stroke-width="6"/>
  <polygon points="340,520 820,520 1100,720 0,720" fill="#70757a"/>
</svg>`);

const DUMMY_CHARA = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700">
  <!-- 茎と葉 -->
  <path d="M 380 680 Q 350 180 150 130" fill="none" stroke="#4c9a2a" stroke-width="10" stroke-linecap="round"/>
  <path d="M 395 680 Q 380 260 240 240" fill="none" stroke="#5bb334" stroke-width="9" stroke-linecap="round"/>
  <path d="M 370 680 Q 340 420 420 260 Q 430 450 390 680 Z" fill="#68c43b"/>
  <path d="M 405 680 Q 440 500 540 390 Q 490 540 420 680 Z" fill="#58ad30"/>
  <!-- 稲穂（実） -->
  <g fill="#f5d11d" stroke="#e0b800" stroke-width="2">
    <circle cx="150" cy="135" r="16"/><circle cx="132" cy="155" r="17"/>
    <circle cx="118" cy="180" r="18"/><circle cx="105" cy="208" r="18"/>
    <circle cx="94" cy="238" r="18"/><circle cx="85" cy="270" r="17"/>
    <circle cx="78" cy="302" r="16"/><circle cx="74" cy="334" r="15"/>
    <circle cx="240" cy="245" r="16"/><circle cx="226" cy="270" r="17"/>
    <circle cx="215" cy="298" r="18"/><circle cx="206" cy="328" r="18"/>
    <circle cx="200" cy="360" r="17"/><circle cx="196" cy="392" r="16"/>
  </g>
</svg>`);

// ==========================================
// 2. 画像パスの登録（差し替え時はここを変更）
// ==========================================
const ASSETS = {
  bg: {
    street: DUMMY_BG,        // 例: "./images/bg_street.png"
    // room: "./images/bg_room.png",
  },
  chara: {
    ine: DUMMY_CHARA,        // 例: "./images/chara_ine.png"
    none: "",                // 立ち絵を非表示にしたい時用
  }
};

// ==========================================
// 3. シナリオデータ（自由に追加・編集）
// ==========================================
const SCENARIO = [
  {
    name: "稲",
    text: "ここにテキストを入力",
    bg: ASSETS.bg.street,
    chara: ASSETS.chara.ine
  },
  {
    name: "稲",
    text: "画面をクリックするか、Enter / Spaceキーで次のセリフに進みます。",
    bg: ASSETS.bg.street,
    chara: ASSETS.chara.ine
  },
  {
    name: "稲",
    text: "右下の「save」「Load」「log」ボタンもそのまま動作します。",
    bg: ASSETS.bg.street,
    chara: ASSETS.chara.ine
  }
];

// ==========================================
// 4. ゲーム進行システム（通常は編集不要）
// ==========================================
const SAVE_KEY = "novel_game_save_v1";
const TEXT_SPEED_MS = 30; // 文字送りの速さ（ミリ秒）

let currentIndex = 0;
let displayedText = "";
let typingTimer = null;
let isTyping = false;
let historyLog = [];

const gameContainer = document.getElementById("game-container");
const bgImage = document.getElementById("bg-image");
const charaImage = document.getElementById("chara-image");
const nameBox = document.getElementById("name-box");
const charaName = document.getElementById("chara-name");
const messageText = document.getElementById("message-text");
const toast = document.getElementById("toast");
const logModal = document.getElementById("log-modal");
const logList = document.getElementById("log-list");

// シーンの描画
function renderScene(index, skipTyping = false) {
  const scene = SCENARIO[index];
  if (!scene) return;

  // 背景の更新
  if (scene.bg) {
    bgImage.src = scene.bg;
  }

  // 立ち絵の更新
  if (scene.chara) {
    charaImage.src = scene.chara;
    charaImage.style.display = "block";
  } else {
    charaImage.style.display = "none";
  }

  // 名前の更新（空文字なら名前枠を隠す）
  if (scene.name) {
    charaName.textContent = scene.name;
    nameBox.classList.remove("hidden");
  } else {
    charaName.textContent = "";
    nameBox.classList.add("hidden");
  }

  // 履歴に追加（重複防止）
  const lastLog = historyLog[historyLog.length - 1];
  if (!lastLog || lastLog.index !== index) {
    historyLog.push({ index, name: scene.name || "", text: scene.text });
  }

  // テキスト表示（タイプライター演出）
  clearInterval(typingTimer);
  if (skipTyping) {
    messageText.textContent = scene.text;
    isTyping = false;
    return;
  }

  isTyping = true;
  displayedText = "";
  messageText.textContent = "";
  let charPos = 0;

  typingTimer = setInterval(() => {
    displayedText += scene.text[charPos];
    messageText.textContent = displayedText;
    charPos++;

    if (charPos >= scene.text.length) {
      clearInterval(typingTimer);
      isTyping = false;
    }
  }, TEXT_SPEED_MS);
}

// 次の進行処理
function advance() {
  if (!logModal.classList.contains("hidden")) return;

  const scene = SCENARIO[currentIndex];
  if (isTyping) {
    // 文字送り中なら全文を一気に表示
    clearInterval(typingTimer);
    messageText.textContent = scene.text;
    isTyping = false;
    return;
  }

  if (currentIndex < SCENARIO.length - 1) {
    currentIndex++;
    renderScene(currentIndex);
  } else {
    showToast("最後のセリフです");
  }
}

// 通知メッセージ表示
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 1800);
}

// クリック・キーボード操作
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
  currentIndex = saveData.currentIndex || 0;
  historyLog = saveData.historyLog || [];
  renderScene(currentIndex, true);
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
renderScene(currentIndex);
