import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { OpenDeskEditor } from '../dist/index.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'MutationObserver']) {
  Object.defineProperty(globalThis, name, { value: dom.window[name], configurable: true });
}

test('built engine formats and serializes synthetic content', () => {
  const engine = new OpenDeskEditor({ content: '<p>Synthetic document</p>' });
  const editor = engine.initialize();
  try {
    editor.commands.selectAll();
    assert.equal(editor.commands.toggleBold(), true);
    assert.match(editor.getHTML(), /<strong>Synthetic document<\/strong>/);
    assert.equal(editor.commands.toggleBold(), true);
    assert.doesNotMatch(editor.getHTML(), /<strong>/);
    assert.equal(editor.commands.toggleHeading({ level: 2 }), true);
    assert.match(editor.getHTML(), /<h2>/);
    assert.equal(editor.commands.toggleTaskList(), true);
    assert.match(editor.getHTML(), /data-type="taskList"/);
    assert.equal(engine.initialize(), editor, 'initialization is idempotent');
  } finally {
    engine.destroy();
  }
});
