// ==========================================
// 1. 画像の登録（差し替え時はここを変更）
// ==========================================
const DUMMY_BG = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#87ceeb"/>
  <circle cx="650" cy="240" r="100" fill="#fff" opacity="0.9"/>
  <rect x="0" y="0" width="340" height="520" fill="#f2df8d"/>
  <rect x="820" y="330" width="460" height="390" fill="#a87654"/>
  <polygon points="340,520 820,520 1100,720 0,720" fill="#70757a"/>
</svg>`);

const DUMMY_CHARA = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700">
  <path d="M 380 680 Q 350 180 150 130" fill="none" stroke="#4c9a2a" stroke-width="10" stroke-linecap="round"/>
  <path d="M 370 680 Q 340 420 420 260 Q 430 450 390 680 Z" fill="#68c43b"/>
  <g fill="#f5d11d">
    <circle cx="150" cy="135" r="16"/><circle cx="132" cy="155" r="17"/>
    <circle cx="118" cy="180" r="18"/><circle cx="105" cy="208" r="18"/>
    <circle cx="94" cy="238" r="18"/><circle cx="85" cy="270" r="17"/>
  </g>
</svg>`);

const GAME_ASSETS = {
  bg: {
    street: DUMMY_BG,       // 例: "./images/bg_street.png"
    // room: "./images/bg_room.png",
  },
  chara: {
    ine: DUMMY_CHARA,       // 例: "./images/chara_ine.png"
    none: "",
  }
};

// ==========================================
// 2. シナリオ本文（1行ずつ並べるだけ）
// ==========================================
/*
【書き方ルール】
  普通の文          ：そのままセリフとして表示
  # 名前            ：話す人の名前を変更（# だけ書くと名前枠を消す）
  @bg 背景名        ：背景を変更
  @chara キャラ名   ：立ち絵を変更（@chara none で消す）
  ? 選択肢A -> *飛び先1 | 選択肢B -> *飛び先2  ：選択肢を表示して分岐
  *飛び先名         ：ジャンプ先の目印（ラベル）
  -> *飛び先名      ：別の目印へ移動（合流などに使用）
  // メモ           ：ゲームには表示されないコメント
*/

const SCRIPT_TEXT = `
@bg street
@chara ine
# 稲
ここにテキストを入力
名前や背景は一度指定すれば続くので、セリフだけを縦に並べて書けます。
途中にセリフを足しても、番号を書き直す必要はありません。

#
（# だけ書くと名前枠が消えて、地の文になります）

# 稲
次は選択肢を出します。どちらに進みますか？
? 右の道へ進む -> *route_1 | 左の道へ進む -> *route_2

*route_1
右の道を選びましたね！
このルートのセリフを好きなだけ書けます。
-> *gouryuu

*route_2
左の道を選びましたね！
選択肢は「|」で区切れば3つ以上にも増やせます。
-> *gouryuu

*gouryuu
ここで両方のルートが合流しました。
`;
