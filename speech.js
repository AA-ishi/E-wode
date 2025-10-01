
export async function waitForVoices() {
  return new Promise(resolve => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      speechSynthesis.onvoiceschanged = () => {
        resolve(speechSynthesis.getVoices());
      };
    }
  });
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
