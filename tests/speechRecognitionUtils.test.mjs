import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

async function importTypeScriptModule(sourcePath) {
  const source = await readFile(sourcePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022
    }
  });
  const compiledPath = resolve('node_modules/.tmp/voice-tests', sourcePath.replace(/[\\/:]/g, '_').replace(/\.ts$/, '.mjs'));
  await mkdir(dirname(compiledPath), { recursive: true });
  await writeFile(compiledPath, output.outputText);
  return import(`${pathToFileURL(compiledPath).href}?cacheBust=${Date.now()}`);
}

const utils = await importTypeScriptModule(resolve('src/composables/speechRecognitionUtils.ts'));

test('parseSpeechResult separates interim and final transcripts from resultIndex', () => {
  const result = utils.parseSpeechResult({
    resultIndex: 1,
    results: [
      [{ transcript: 'ignored' }],
      Object.assign([{ transcript: '实时' }], { isFinal: false }),
      Object.assign([{ transcript: '结果' }], { isFinal: true })
    ]
  });

  assert.deepEqual(result, {
    finalText: '结果',
    interimText: '实时'
  });
});

test('normalizeSpeechText fixes common AI product terms', () => {
  assert.equal(utils.normalizeSpeechText('请介绍 rag 和 麦cp 在斯特拉中的作用'), '请介绍 RAG 和 MCP 在Stel1aChat中的作用');
});

test('formatAppendedInput preserves existing text and adds readable spacing', () => {
  assert.equal(utils.formatAppendedInput('已有问题', '继续提问'), '已有问题 继续提问');
  assert.equal(utils.formatAppendedInput('', '新的问题'), '新的问题');
});

test('getSpeechErrorMessage maps browser speech errors to actionable messages', () => {
  assert.equal(utils.getSpeechErrorMessage('not-allowed'), '请允许浏览器麦克风权限后再使用语音输入');
  assert.equal(utils.getSpeechErrorMessage('audio-capture'), '未检测到可用麦克风，请检查设备连接');
  assert.equal(utils.getSpeechErrorMessage('unknown'), '语音识别失败：unknown');
});
