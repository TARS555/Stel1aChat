type SpeechResultLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
};

const speechCorrections: Array<[RegExp, string]> = [
  [/\brag\b/gi, 'RAG'],
  [/麦\s*cp/gi, 'MCP'],
  [/\bmcp\b/gi, 'MCP'],
  [/斯特拉/gi, 'Stel1aChat']
];

const speechErrorMessages: Record<string, string> = {
  'audio-capture': '未检测到可用麦克风，请检查设备连接',
  'not-allowed': '请允许浏览器麦克风权限后再使用语音输入',
  'no-speech': '没有检测到语音，请再试一次',
  aborted: '已取消本次语音输入',
  network: '语音识别服务暂时不可用，请稍后重试'
};

export function parseSpeechResult(event: SpeechResultLike) {
  let interimText = '';
  let finalText = '';

  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index];
    const text = result[0]?.transcript ?? '';

    if (result.isFinal) {
      finalText += text;
    } else {
      interimText += text;
    }
  }

  return {
    finalText: finalText.trim(),
    interimText: interimText.trim()
  };
}

export function normalizeSpeechText(text: string) {
  return speechCorrections.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text.trim());
}

export function formatAppendedInput(currentValue: string, nextValue: string) {
  const current = currentValue.trim();
  const next = nextValue.trim();

  if (!current) {
    return next;
  }

  if (!next) {
    return current;
  }

  return `${current} ${next}`;
}

export function getSpeechErrorMessage(errorCode: string) {
  return speechErrorMessages[errorCode] ?? `语音识别失败：${errorCode}`;
}
