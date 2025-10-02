let words = [];
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

// ユーザー名入力
document.getElementById("startBtn").addEventListener("click", () => {
  const input = document.getElementById("userNameInput").value.trim();
  if (input) {
    currentUser = input;
    localStorage.setItem("currentUser", currentUser);
    document.getElementById("userLogin").classList.add("hidden");
    initializeApp();
  }
});

// 初期化処理
function initializeApp() {
  Promise.all([loadWords(), loadMessages()]).then(() => {
    words = words.filter(word => {
      return localStorage.getItem(`${currentUser}_checked_${word.Word}`) !== '1';
    });
    updateMessage();
  });
}

// CSVパース
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
    .then(res => {
      if (!res.ok) throw new Error("CSV読み込み失敗");
      return res.text();
    })
    .then(text => {
      const all = parseCSV(text);
      checkedWords = all.filter(w => w.Check === '1').map(w => w.Word);
      words = all.filter(w => w.Check !== '1');
    })
    .catch(err => {
      console.error(err);
      alert("単語データの読み込みに失敗しました。");
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

// 応援メッセージと進捗バー更新
function updateMessage() {
  const checkedCount = Object.keys(localStorage).filter(key =>
    key.startsWith(`${currentUser}_checked_`)
  ).length;

  const totalWords = checkedWords.length + words.length;
  let percent = 0;
  if (totalWords > 0) {
    percent = Math.floor((checkedCount / totalWords) * 100);
  }

  // メッセージ選択
  let selectedMessage = messages[0]?.message ?? '';
  for (let i = messages.length - 1; i >= 0; i--) {
    if (checkedCount >= messages[i].count) {
      selectedMessage = messages[i].message;
      break;
    }
  }

  topMessageArea.textContent = `${currentUser} さん！${selectedMessage}`;
  topMessageArea.style.background = `linear-gradient(to right, #2196f3 ${100 - percent}%, #4caf50 ${percent}%)`;
}

// 音声読み上げ
function speak(text) {
  if (!('speechSynthesis' in window)) return;

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';

  const voices = speechSynthesis.getVoices();
  utter.voice =
    voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
    voices.find(v => v.lang.startsWith('en')) ||
    voices[0];

  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

// 単語表示
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

  speak(`${currentWord.Word}. ${currentWord['Example Sentence']}`);
}

// 答え表示
function showAnswer() {
  if (!currentWord) return;

  answerDisplay.innerHTML = `
    <strong>${currentWord.Translation}</strong>（${currentWord['Part of Speech']}）
  `;
  answerDisplay.classList.remove('hidden');
  checkSection.classList.remove('hidden');
}

// チェック処理
understoodCheckbox.addEventListener('change', () => {
  if (understoodCheckbox.checked && currentWord) {
    localStorage.setItem(`${currentUser}_checked_${currentWord.Word}`, '1');
    checkedWords.push(currentWord.Word);
    words = words.filter(w => w.Word !== currentWord.Word);
    updateMessage();
  }
});

// イベント登録
showWordBtn.addEventListener('click', showRandomWord);
showAnswerBtn.addEventListener('click', showAnswer);

// 進捗リセット
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

// 自動ログイン対応
window.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = savedUser;
    document.getElementById("userLogin").classList.add("hidden");
    initializeApp();
  }
});
