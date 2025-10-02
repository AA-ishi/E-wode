
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


export async function speak(text) {
  if (!('speechSynthesis' in window)) return;

  const voices = await waitForVoices();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';

  const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
  if (enVoice) utter.voice = enVoice;

  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}
