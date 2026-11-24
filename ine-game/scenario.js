// ==========================================
// 0. タイトル画面の文字設定
// ==========================================
const GAME_TITLE = "ノベルゲーム";

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
  <path d="M 380 680 Q 350 180 150 130" fill="none" stroke="#4c9a2a" stroke-width="10" stroke-linecap="round"/>
  <path d="M 395 680 Q 380 260 240 240" fill="none" stroke="#5bb334" stroke-width="9" stroke-linecap="round"/>
  <path d="M 370 680 Q 340 420 420 260 Q 430 450 390 680 Z" fill="#68c43b"/>
  <path d="M 405 680 Q 440 500 540 390 Q 490 540 420 680 Z" fill="#58ad30"/>
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
// 2. 画像の登録（差し替え時はここを変更）
// ==========================================
const GAME_ASSETS = {
  bg: {
    title: DUMMY_BG,
    street: DUMMY_BG,
  },
  chara: {
    ine: DUMMY_CHARA,
  },
  ui: {
    titleLogo: "",
  }
};

// ==========================================
// 3. 用語解説データ（単語と説明文を登録）
// ==========================================
const GAME_GLOSSARY = {
  "稲穂": "イネの花が咲いたあとに実る穂のこと。\n秋になると黄金色に実り、重みで頭を垂れる。",
  "カーブミラー": "見通しの悪い交差点や曲がり角に設置される鏡。\n死角にいる車や歩行者を確認するために使われる。",
  "用語解説": "文章中の色がついた単語をクリックすることで、意味を確認できる機能。"
};

// ==========================================
// 4. メッセージ・選択肢・演出（1行ずつ並べて編集）
// ==========================================
const SCRIPT_TEXT = `
@bg off
@chara off
## 第一章 はじまりの朝

@bg street
@chara ine
# 稲
こんにちは！私の名前は稲（いね）です。
文章の中に[[稲穂]]や[[カーブミラー]]のように色がついた単語があります。
その単語をクリックすると、[[用語解説]]のウィンドウが開きます。
右上の「閉じる」ボタンを押せば、いつでもこの画面に戻れますよ！

どちらの道に進みますか？
? 右の道へ進む -> *route_1 | 左の道へ進む -> *route_2

*route_1
右の道を選びました。
-> *ending

*route_2
左の道を選びました。
-> *ending

*ending
最後のセリフです。もう一回クリックするとタイトルに戻ります。
`;
