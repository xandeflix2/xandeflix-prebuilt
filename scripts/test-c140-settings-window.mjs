import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
const dir = 'tmp/c140-settings-windows'; fs.mkdirSync(dir, { recursive: true });
class Element extends EventTarget {
  constructor({ close = false, disabled = false, visible = true, editing = false } = {}) { super(); Object.assign(this, { closeButton: close, disabled, visible, editing, isConnected: true }); }
  hasAttribute(name) { return name === 'data-settings-close' && this.closeButton; }
  getClientRects() { return this.visible ? [{}] : []; }
  matches() { return this.editing; }
  focus() { document.activeElement = this; }
  scrollIntoView() { this.scrolled = true; }
}
class Dialog extends Element {
  constructor(items) { super(); this.items = items; this.open = false; dialogs.push(this); }
  querySelectorAll() { return this.items.filter(item => !item.disabled); }
  showModal() { this.open = true; this.opens = (this.opens || 0) + 1; }
  close() { if (!this.open) return; this.open = false; queueMicrotask(() => this.dispatchEvent(new Event('close'))); }
}
const dialogs = [], window = new EventTarget();
const document = { activeElement: null, querySelectorAll: () => dialogs.filter(dialog => dialog.open), querySelector: () => dialogs.find(dialog => dialog.open) || null };
const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/ui/settings/settings-window.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports, window, document, HTMLElement: Element, Array });
const { openSettingsWindow, openSettingsDestination } = exports;
const tick = async () => { await Promise.resolve(); await Promise.resolve(); };
const key = (name, options = {}) => { const event = new Event('keydown', { cancelable: true });
  Object.defineProperties(event, { key: { value: name }, shiftKey: { value: options.shiftKey || false }, target: { value: options.target || document.activeElement } });
  window.dispatchEvent(event); return event;
};
const fixture = () => {
  const trigger = new Element(), close = new Element({ close: true }), disabled = new Element({ disabled: true }), hidden = new Element({ visible: false });
  const first = new Element(), last = new Element(), dialog = new Dialog([close, disabled, hidden, first, last]); trigger.focus();
  const cleanup = openSettingsWindow(dialog, trigger); return { trigger, close, disabled, hidden, first, last, dialog, cleanup };
};
let tests = 0;
async function test(name, run) { await run(); tests++; assert.ok(!dialogs.some(dialog => dialog.open)); console.log('PASS ' + name); }
await test('OPEN_FOCUSES_FIRST_AVAILABLE_ACTION_AND_CLOSE_RESTORES_TRIGGER', async () => {
  const f = fixture(); assert.equal(f.dialog.open, true); assert.equal(document.activeElement, f.first);
  f.dialog.close(); await tick(); assert.equal(document.activeElement, f.trigger); f.cleanup();
});
await test('DPAD_AND_TAB_STAY_IN_WINDOW_AND_SKIP_DISABLED_HIDDEN', async () => {
  const f = fixture(); let propagated = 0; const spy = () => propagated++; window.addEventListener('keydown', spy);
  for (const [name, target, shiftKey] of [['ArrowUp', f.close], ['ArrowUp', f.last], ['ArrowDown', f.close], ['ArrowRight', f.first], ['ArrowLeft', f.close], ['Tab', f.last, true], ['Tab', f.close]]) {
    const event = key(name, { shiftKey }); assert.equal(event.defaultPrevented, true); assert.equal(document.activeElement, target);
  }
  assert.equal(propagated, 0); key('Enter'); assert.equal(propagated, 1, 'existing activation handler still owns Enter');
  window.removeEventListener('keydown', spy); f.cleanup(); await tick();
});
await test('ESCAPE_CLOSES_ONLY_WINDOW_AND_REMOVES_KEY_HANDLER', async () => {
  const f = fixture(); assert.equal(key('Escape').defaultPrevented, true); await tick();
  assert.equal(f.dialog.open, false); assert.equal(document.activeElement, f.trigger);
  assert.equal(key('ArrowDown').defaultPrevented, false); f.cleanup();
});
await test('BUSY_OR_EMPTY_BODY_ALWAYS_HAS_ACCESSIBLE_CLOSE', async () => {
  const close = new Element({ close: true }), disabled = new Element({ disabled: true }), dialog = new Dialog([close, disabled]);
  const cleanup = openSettingsWindow(dialog, new Element()); assert.equal(document.activeElement, close);
  key('ArrowDown'); assert.equal(document.activeElement, close); cleanup(); await tick();
});
await test('OTHER_DIALOG_KEEPS_KEYBOARD_AND_FOCUS_OWNERSHIP', async () => {
  const f = fixture(), other = new Dialog([new Element()]); other.showModal(); other.items[0].focus();
  assert.equal(key('Escape').defaultPrevented, false); assert.equal(f.dialog.open, true); assert.equal(other.open, true);
  f.dialog.close(); await tick(); assert.equal(document.activeElement, other.items[0]);
  other.close(); f.cleanup(); await tick();
});
await test('EDITING_KEYS_ARE_PRESERVED_AND_UNMOUNT_CLEANUP_RELEASES_WINDOW', async () => {
  const f = fixture(), input = new Element({ editing: true }); f.dialog.items.push(input); input.focus();
  assert.equal(key('Backspace').defaultPrevented, false); assert.equal(key('ArrowLeft').defaultPrevented, false);
  assert.equal(document.activeElement, input); f.trigger.isConnected = false; f.cleanup(); await tick();
  assert.equal(f.dialog.open, false); assert.equal(key('ArrowDown').defaultPrevented, false);
});
await test('DESTINATION_CLOSES_WINDOW_BEFORE_EXISTING_CALLBACK', async () => {
  const f = fixture(); openSettingsDestination(); assert.equal(f.dialog.open, true);
  let calls = 0; openSettingsDestination(() => { assert.equal(f.dialog.open, false); calls++; });
  assert.equal(calls, 1); await tick(); f.cleanup();
});
await test('REOPEN_RETAINS_BODY_AND_DOES_NOT_ACCUMULATE_LISTENERS', async () => {
  const f = fixture(); f.dialog.close(); await tick(); f.cleanup();
  const cleanup = openSettingsWindow(f.dialog, f.trigger); assert.equal(f.dialog.opens, 2);
  key('ArrowDown'); assert.equal(document.activeElement, f.last, 'single key step after reopening');
  assert.equal(key('Backspace').defaultPrevented, true); await tick(); cleanup();
});
const source = fs.readFileSync('src/ui/pages/SettingsPage.tsx', 'utf8');
assert.match(source, /data-settings-modal/); assert.ok(!source.includes('data-detail-modal')); assert.ok(!source.includes('<details'));
assert.match(fs.readFileSync('src/App.tsx', 'utf8'), /dialog\[data-settings-modal\]\[open\]/);
fs.writeFileSync(dir + '/window-tests.json', JSON.stringify({ result: 'PASS', tests, syntheticDOM: true, browserPhysicallyTested: false }, null, 2));
console.log('C140_SETTINGS_WINDOW=' + tests + '/' + tests + '_PASS');
