import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { widgetHtml, widgetResource } from '../src/lib/mcp/widget.ts';

const route = await readFile(new URL('../src/app/api/mcp/route.ts', import.meta.url), 'utf8');
assert.match(route, /ui: \{ resourceUri: RESOURCE_URI \}/);
assert.match(route, /'openai\/outputTemplate': OPENAI_RESOURCE_URI/);
assert.match(route, /OPENAI_RESOURCE_MIME_TYPE = 'text\/html\+skybridge'/);
assert.match(route, /resource\(RESOURCE_URI, RESOURCE_MIME_TYPE\)/);
assert.match(route, /resource\(OPENAI_RESOURCE_URI, OPENAI_RESOURCE_MIME_TYPE\)/);

const standardResource = widgetResource('ui://test/app.html', 'text/html;profile=mcp-app', 'https://example.com');
const openAiResource = widgetResource('ui://test/app-chatgpt.html', 'text/html+skybridge', 'https://example.com');
assert.equal(standardResource.contents[0].uri, 'ui://test/app.html');
assert.equal(standardResource.contents[0].mimeType, 'text/html;profile=mcp-app');
assert.equal(openAiResource.contents[0].uri, 'ui://test/app-chatgpt.html');
assert.equal(openAiResource.contents[0].mimeType, 'text/html+skybridge');
assert.equal(standardResource.contents[0].text, openAiResource.contents[0].text);
assert.deepEqual(standardResource.contents[0]._meta.ui.csp.connectDomains, ['https://example.com']);
assert.deepEqual(openAiResource.contents[0]._meta['openai/widgetCSP'].resource_domains, ['https://example.com']);

const html = widgetHtml();
assert.match(html, /^<!doctype html>/);
assert.doesNotMatch(html, /<script[^>]+src=/);
assert.doesNotMatch(html, /\/_next\//);

const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
assert.ok(script, 'widget has an inline script');

function browser(openai) {
  const listeners = new Map();
  const root = { className: 'status', innerHTML: '', textContent: '' };
  const button = {};
  const messages = [];
  const window = {
    openai,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    open() {},
  };
  const context = {
    window,
    parent: { postMessage(message) { messages.push(message); } },
    document: { querySelector(selector) { return selector === '#root' ? root : button; } },
    console,
    Date,
    Error,
    Map,
    Promise,
    String,
  };
  vm.runInNewContext(script, context);
  return { listeners, messages, root };
}

const payload = {
  kind: 'post',
  post: {
    title: 'Rendered by the host',
    categoryName: 'Test',
    publishedAt: '2026-09-29',
    description: 'A real tool result',
    body: 'First paragraph.',
    url: 'https://example.com/post',
  },
};

const chatgpt = browser({ toolOutput: payload, openExternal() {} });
assert.match(chatgpt.root.innerHTML, /Rendered by the host/);
assert.equal(chatgpt.messages.length, 0, 'ChatGPT uses its injected host bridge');

const mcp = browser(undefined);
assert.equal(mcp.messages[0].method, 'ui/initialize');
mcp.listeners.get('message')({ data: { jsonrpc: '2.0', id: mcp.messages[0].id, result: {} } });
await Promise.resolve();
assert.equal(mcp.messages[1].method, 'ui/notifications/initialized');
mcp.listeners.get('message')({
  data: { jsonrpc: '2.0', method: 'ui/notifications/tool-result', params: { structuredContent: payload } },
});
assert.match(mcp.root.innerHTML, /Rendered by the host/);

console.log('MCP widget host bridge tests passed');
