function waitForVoices(callback) {
  const voices = speechSynthesis.getVoices();
  if (voices.length > 0) {
    callback(voices);
  } else {
    speechSynthesis.onvoiceschanged = () => {
      callback(speechSynthesis.getVoices());
    };
  }
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;

  waitForVoices((voices) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';

    const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
    if (enVoice) utter.voice = enVoice;

    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  });
}
