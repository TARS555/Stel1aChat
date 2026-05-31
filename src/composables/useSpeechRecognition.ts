import { computed, ref } from 'vue';
import { getSpeechErrorMessage, normalizeSpeechText, parseSpeechResult } from './speechRecognitionUtils';

export type VoiceStatus = 'idle' | 'recording' | 'processing';

export function useSpeechRecognition(onText: (text: string) => void) {
  const status = ref<VoiceStatus>('idle');
  const error = ref('');
  const interimText = ref('');
  let recognition: SpeechRecognition | null = null;

  const supported = computed(() => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition));

  const stop = () => {
    if (status.value !== 'recording') {
      return;
    }

    recognition?.stop();
    status.value = 'processing';
  };

  const cancel = () => {
    if (status.value === 'idle') {
      return;
    }

    recognition?.abort();
    recognition = null;
    interimText.value = '';
    status.value = 'idle';
  };

  const start = () => {
    if (status.value !== 'idle') {
      return;
    }

    error.value = '';
    interimText.value = '';

    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      error.value = '当前浏览器不支持语音识别';
      return;
    }

    recognition = new SpeechRecognitionConstructor();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const result = parseSpeechResult(event);
      interimText.value = result.interimText;
      const finalText = normalizeSpeechText(result.finalText);

      if (finalText) {
        status.value = 'processing';
        interimText.value = '';
        onText(finalText);
      }
    };

    recognition.onerror = (event) => {
      error.value = getSpeechErrorMessage(event.error);
      interimText.value = '';
      status.value = 'idle';
    };

    recognition.onend = () => {
      recognition = null;
      interimText.value = '';
      status.value = 'idle';
    };

    recognition.start();
    status.value = 'recording';
  };

  return {
    cancel,
    error,
    interimText,
    start,
    status,
    stop,
    supported
  };
}
