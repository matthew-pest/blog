/**
 * Drives the widget with the *real* MCP Apps host implementation
 * (`AppBridge` from @modelcontextprotocol/ext-apps) and the real MCP server
 * SDK, so a regression in the handshake, the resource registration, or the
 * ChatGPT compatibility path fails here instead of in a host we can't debug.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { AppBridge } from '@modelcontextprotocol/ext-apps/app-bridge';
import { RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport, McpServer } from '@modelcontextprotocol/server';
import {
  UI_PROTOCOL_VERSION,
  WIDGET_TOOL_META,
  WIDGET_URI,
  registerWidgetResources,
  widgetHtml,
} from '../src/lib/mcp/widget.ts';

const tick = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));

const payload = {
  kind: 'post',
  post: {
    title: 'Rendered by the host',
    categoryName: 'Test',
    publishedAt: '2026-09-29',
    description: 'A real tool result',
    body: 'First paragraph.\n\nSecond paragraph.',
    url: 'https://example.com/post',
  },
};

// ---------------------------------------------------------------------------
// Static shape: one stable URI, standard MIME type, self-contained document.
// ---------------------------------------------------------------------------
const route = await readFile(new URL('../src/app/api/mcp/route.ts', import.meta.url), 'utf8');
assert.equal(route.match(/_meta: WIDGET_TOOL_META/g)?.length, 2, 'read_post and get_resume carry the widget meta');
assert.match(route, /registerWidgetResources\(server, baseUrl\)/);
assert.equal(WIDGET_TOOL_META.ui.resourceUri, WIDGET_URI);
assert.equal(WIDGET_TOOL_META['openai/outputTemplate'], WIDGET_URI, 'ChatGPT alias points at the same resource');
assert.doesNotMatch(WIDGET_URI, /[?#]/, 'the canonical URI is stable (no cache-busting query)');

const html = widgetHtml();
assert.match(html, /^<!doctype html>/);
assert.doesNotMatch(html, /<script[^>]+src=/);
assert.doesNotMatch(html, /\/_next\//);
const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
assert.ok(script, 'widget has an inline script');

// ---------------------------------------------------------------------------
// Server: resources/list, resources/read, and stale versioned URIs.
// ---------------------------------------------------------------------------
{
  const server = new McpServer({ name: 'test', version: '1' });
  registerWidgetResources(server, () => 'https://example.com');
  const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: 'test-client', version: '1' });
  await client.connect(clientTransport);

  const { resources } = await client.listResources();
  assert.deepEqual(
    resources.map((r) => [r.uri, r.mimeType]),
    [[WIDGET_URI, RESOURCE_MIME_TYPE]],
    'the canonical widget is listed with the MCP Apps MIME type'
  );

  for (const uri of [WIDGET_URI, 'ui://mattpest/app.html?v=2026-09-29-4', 'ui://mattpest/app-chatgpt.html?v=2026-09-29-4']) {
    const { contents } = await client.readResource({ uri });
    assert.equal(contents.length, 1);
    assert.equal(contents[0].uri, uri, 'the read echoes the requested URI');
    assert.equal(contents[0].mimeType, RESOURCE_MIME_TYPE);
    assert.equal(contents[0].text, html);
    assert.deepEqual(contents[0]._meta.ui.csp.connectDomains, ['https://example.com']);
    assert.equal(contents[0]._meta['openai/widgetCSP'].connect_domains[0], 'https://example.com');
  }
  await client.close();
  await server.close();
}

// ---------------------------------------------------------------------------
// A fake browser just big enough for the widget script.
// ---------------------------------------------------------------------------
function browser({ openai, deliverToHost }) {
  const listeners = new Map();
  const root = { className: 'status', innerHTML: '', textContent: 'Loading…' }; // initial markup
  const button = {};
  const documentElement = {
    style: { height: '', colorScheme: '', setProperty(name, value) { this[name] = value; } },
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    getBoundingClientRect() { return { height: 240 }; },
  };
  // postMessage structured-clones, which also drops the vm realm's prototypes.
  const parent = { postMessage: (message) => deliverToHost(JSON.parse(JSON.stringify(message))) };
  const window = {
    parent,
    openai,
    innerWidth: 600,
    addEventListener(type, listener) { listeners.set(type, listener); },
    requestAnimationFrame(fn) { setTimeout(fn, 0); },
    open() {},
  };
  const context = {
    window,
    document: { documentElement, body: {}, querySelector: (s) => (s === '#root' ? root : button) },
    ResizeObserver: class { observe() {} },
    setTimeout,
    console,
  };
  vm.runInNewContext(script, context);
  return {
    root,
    button,
    documentElement,
    window,
    /** Deliver a message from the host, the way the browser would. */
    deliver(message) { listeners.get('message')?.({ source: parent, data: message }); },
    fire(type) { listeners.get(type)?.(); },
  };
}

// ---------------------------------------------------------------------------
// MCP Apps host (Claude, VS Code, ChatGPT's MCP Apps mode): real AppBridge.
// ---------------------------------------------------------------------------
{
  const fromWidget = [];
  const toWidget = [];
  let page;
  const transport = {
    onmessage: undefined,
    onclose: undefined,
    onerror: undefined,
    async start() {},
    async send(message) { toWidget.push(message); page?.deliver(message); },
    async close() {},
  };
  const bridge = new AppBridge(
    null,
    { name: 'test-host', version: '1.0.0' },
    { openLinks: {} },
    { hostContext: { theme: 'dark', styles: { variables: { '--color-text-primary': '#eee' } } } }
  );
  let initialized = false;
  const opened = [];
  const sizes = [];
  bridge.oninitialized = () => { initialized = true; };
  bridge.onopenlink = async ({ url }) => { opened.push(url); return {}; };
  bridge.addEventListener('sizechange', (params) => sizes.push(params));
  await bridge.connect(transport);

  page = browser({
    deliverToHost(message) { fromWidget.push(message); transport.onmessage?.(message); },
  });
  await tick();

  const init = fromWidget.find((m) => m.method === 'ui/initialize');
  assert.ok(init, 'widget sends ui/initialize');
  assert.equal(init.params.protocolVersion, UI_PROTOCOL_VERSION);
  assert.deepEqual(init.params.appInfo, { name: 'mattpest.com', version: '1.0.0' });
  assert.deepEqual(init.params.appCapabilities, {});
  assert.ok(initialized, 'host accepted the handshake and received ui/notifications/initialized');
  assert.equal(page.root.textContent, 'Waiting for the tool result…');
  assert.equal(page.documentElement.attributes['data-theme'], 'dark');
  assert.equal(page.documentElement.style['--color-text-primary'], '#eee');
  assert.deepEqual(sizes.at(-1), { width: 600, height: 240 }, 'widget reports its size so the host can fit the iframe');

  await bridge.sendToolInput({ arguments: { slug: 'x' } });
  await bridge.sendToolResult({ content: [{ type: 'text', text: 'ignored' }], structuredContent: payload });
  await tick();
  assert.match(page.root.innerHTML, /Rendered by the host/);
  assert.match(page.root.innerHTML, /<p>First paragraph\.<\/p><p>Second paragraph\.<\/p>/);

  page.button.onclick();
  await tick();
  assert.deepEqual(opened, [payload.post.url], 'links open through ui/open-link');

  // Host requests get answered so teardown never hangs on us.
  await transport.send({ jsonrpc: '2.0', id: 'teardown', method: 'ui/resource-teardown', params: { reason: 'test' } });
  await tick();
  assert.ok(
    fromWidget.some((m) => m.id === 'teardown' && m.result && !m.error),
    'widget acknowledges ui/resource-teardown'
  );
  await bridge.close();
}

// ---------------------------------------------------------------------------
// ChatGPT's legacy bridge: window.openai carries the result, host never answers.
// ---------------------------------------------------------------------------
{
  const page = browser({ openai: { toolOutput: payload, openExternal() {} }, deliverToHost() {} });
  assert.match(page.root.innerHTML, /Rendered by the host/, 'renders from window.openai.toolOutput without a handshake');
}
{
  const openai = { toolOutput: null, openExternal() {} };
  const page = browser({ openai, deliverToHost() {} });
  assert.equal(page.root.textContent, 'Loading…');
  openai.toolOutput = { structuredContent: { kind: 'resume', resume: { name: 'Matt Pest', experience: [], highlights: [], website: 'https://example.com' } } };
  page.fire('openai:set_globals');
  assert.match(page.root.innerHTML, /Matt Pest/, 'renders when ChatGPT sets globals later');
}

console.log('MCP widget tests passed');
