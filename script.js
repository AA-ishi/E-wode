js



var words = [];
let messages = [];
let checkedWords = [];
let currentWord = null;
let currentUser = null;

const topMessageArea = document.getElementById('topMessageArea');
const showWordBtn = document.getElementById('showWordBtn');
const wordDisplay = document.getElementById('wordDisplay');
const icon2Wrapper = document.getElementById('icon2Wrapper');
const showAnswerBtn = document.getElementById('showAnswerBtn');
const answerDisplay = document.getElementById('answerDisplay');
const checkSection = document.getElementById('checkSection');
const understoodCheckbox = document.getElementById('understoodCheckbox');

document.getElementById("startBtn").addEventListener("click", () => {
  const input = document.getElementById("userNameInput").value.trim();
  if (input) {
    currentUser = input;
    localStorage.setItem("currentUser", currentUser);
    document.getElementById("userLogin").classList.add("hidden");
    initializeApp();
  }
});


function initializeApp() {
  window.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = savedUser;
    document.getElementById("userLogin").classList.add("hidden");
    initializeApp();
  }
});
  Promise.all([loadWords(), loadMessages()]).then(() => {
    words = words.filter(word => {
      return localStorage.getItem(`${currentUser}_checked_${word.Word}`) !== '1';
    });
    updateMessage(messages[0].message);
  });
}

// CSVを配列にパース
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    let obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = values[i]?.trim() ?? '';
    });
    return obj;
  });
}

// 単語読み込み
function loadWords() {
  return fetch('word-data.csv') 
    .then(res => res.text())
    .then(text => {
      const all = parseCSV(text);
      checkedWords = all.filter(w => w.Check === '1').map(w => w.Word);
      words = all.filter(w => w.Check !== '1');
    });
}

// メッセージ読み込み
function loadMessages() {
  return fetch('message.csv')
    .then(res => res.text())
    .then(text => {
      messages = parseCSV(text).map(m => ({
        count: Number(m.count),
        message: m.message
      }));
      messages.sort((a, b) => a.count - b.count);
    });
}

// 応援メッセージ更新
function speakWordAndExample(currentWord) {
  const utterance = new SpeechSynthesisUtterance(`${currentWord['Word']}. ${currentWord['Example Sentence']}`);
  utterance.lang = 'en-US';
  speechSynthesis.speak(utterance);
}
function updateMessage() {
  const topMessageArea = document.getElementById("topMessageArea");

  // チェック済み単語数を取得
  const checkedCount = Object.keys(localStorage).filter(key =>
    key.startsWith(`${currentUser}_checked_`)
  ).length;

  // メッセージを選ぶ（count以下で最大のもの）
  let selectedMessage = messages[0].message; // デフォルト（count=0）

  for (let i = messages.length - 1; i >= 0; i--) {
    if (checkedCount >= messages[i].count) {
      selectedMessage = messages[i].message;
      break;
    }
  }

  topMessageArea.textContent = `${currentUser} !${selectedMessage}`;
}

// 音声読み上げ
function speak(text) {
  if (!('speechSynthesis' in window)) {
    fallbackSpeak(text);
    return;
  }

  function doSpeak() {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) {
      fallbackSpeak(text);
      return;
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';

    // Google音声を優先し、なければ英語音声、さらになければ最初の音声
      utter.voice =
      voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0];

    if (!utter.voice) {
      fallbackSpeak(text);
      return;
    }

    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  }

  const voices = speechSynthesis.getVoices();
  if (!voices.length) {
    speechSynthesis.onvoiceschanged = () => {
      doSpeak();
    };

    setTimeout(() => {
      if (!speechSynthesis.getVoices().length) {
        fallbackSpeak(text);
      }
    }, 5000);
  } else {
    doSpeak();
  }
}

// 単語表示（アイコン①）
function showRandomWord() {
  if (words.length === 0) {
    wordDisplay.innerHTML = `<strong>すべての単語を覚えました！</strong>`;
    wordDisplay.classList.remove('hidden');
    icon2Wrapper.classList.add('hidden');
    return;
  }

  const index = Math.floor(Math.random() * words.length);
  currentWord = words[index];

  wordDisplay.innerHTML = `
    <strong>${currentWord.Word}</strong><br>
    <em>${currentWord['Example Sentence']}</em>
  `;
  wordDisplay.classList.remove('hidden');
  icon2Wrapper.classList.remove('hidden');
  answerDisplay.classList.add('hidden');
  checkSection.classList.add('hidden');
  understoodCheckbox.checked = false;

  speak(`${currentWord.Word}。${currentWord['Example Sentence']}`);
}

// 答え表示（アイコン②）
function showAnswer() {
  if (!currentWord) return;

  answerDisplay.innerHTML = `
    <strong>${currentWord.Translation}</strong>（${currentWord['Part of Speech']}）
  `;
  answerDisplay.classList.remove('hidden');
  checkSection.classList.remove('hidden');
}

// チェックボックス変更
understoodCheckbox.addEventListener('change', () => {
  if (understoodCheckbox.checked && currentWord) {
    // 状態保存（localStorageに保存）
    localStorage.setItem(`${currentUser}_checked_${currentWord.Word}`, '1');

    // 次回以降除外のため、更新
    checkedWords.push(currentWord.Word);
    words = words.filter(w => w.Word !== currentWord.Word);

    updateMessage();
  }
});

// イベント追加
showWordBtn.addEventListener('click', showRandomWord);
showAnswerBtn.addEventListener('click', showAnswer);

// 初期化
Promise.all([loadWords(), loadMessages()]).then(() => {
  // localStorageのチェック適用
  words = words.filter(word => {
    return localStorage.getItem(`checked_${word.Word}`) !== '1';
  });
 updateMessage(messages[0].message);
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm(`${currentUser} さんの進捗をリセットしますか？\nこの操作は元に戻せません。`)) {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`${currentUser}_checked_`)) {
        localStorage.removeItem(key);
      }
    });
    alert("進捗をリセットしました！");
    location.reload();
  }
});
