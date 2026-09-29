import type { McpServer } from '@modelcontextprotocol/server';
import { ResourceTemplate } from '@modelcontextprotocol/server';
import { RESOURCE_MIME_TYPE, registerAppResource } from '@modelcontextprotocol/ext-apps/server';

/**
 * The MCP App widget that Claude, ChatGPT and VS Code render inline when
 * `read_post` / `get_resume` run.
 *
 * Two things matter more than anything else here:
 *
 * 1. The URI is stable. Hosts cache the tool descriptor (and therefore the
 *    `ui://` URI it points at) per connector, so a versioned URI that changes
 *    on deploy makes every cached descriptor point at a resource the server no
 *    longer knows about, and ChatGPT reports "Failed to fetch template".
 *    `registerWidgetResources` also answers *any* `ui://mattpest/...` URI so
 *    descriptors cached from earlier deployments (`?v=...`) keep working.
 *
 * 2. The document is dependency-free and speaks the MCP Apps wire protocol
 *    exactly: `ui/initialize` → `ui/notifications/initialized` → render on
 *    `ui/notifications/tool-result`. Hosts sandbox the iframe with a CSP that
 *    blocks script fetches, so nothing here loads from `/_next/`.
 */
export const WIDGET_URI = 'ui://mattpest/app.html';

/** Every URI under this prefix resolves to the widget (stale cached URIs included). */
export const WIDGET_URI_TEMPLATE = 'ui://mattpest/{+path}';

/** MCP Apps protocol version the widget speaks (ext-apps `PROTOCOL_VERSION`). */
export const UI_PROTOCOL_VERSION = '2026-01-26';

const MEDIA_ORIGIN = 'https://elasticbeanstalk-us-east-2-641171614455.s3.us-east-2.amazonaws.com';

export function widgetHtml(): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{color-scheme:light dark;font-family:var(--font-sans,system-ui,sans-serif)}*{box-sizing:border-box}html,body{margin:0;background:transparent}body{padding:8px;color:var(--color-text-primary,currentColor)}article{max-width:680px;padding:20px;border:1px solid var(--color-border-secondary,#7775);border-radius:16px;background:var(--color-background-primary,#fff1)}.eyebrow{margin:0 0 8px;text-transform:uppercase;letter-spacing:.08em;font-size:12px;opacity:.7}h1{margin:0 0 8px;font-size:24px;line-height:1.15}p{line-height:1.5}.muted{opacity:.72}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin:18px 0}.card{padding:12px;border:1px solid var(--color-border-secondary,#7775);border-radius:12px}.card p{margin:4px 0 0;font-size:12px}.body{max-height:320px;overflow:auto}button{padding:9px 15px;border:0;border-radius:999px;background:var(--color-background-inverse,#111);color:var(--color-text-inverse,#fff);font:inherit;cursor:pointer}.status{padding:20px;opacity:.7}
</style></head><body><div id="root" class="status">Loading…</div>
<script>
(function(){
var PROTOCOL_VERSION='${UI_PROTOCOL_VERSION}';
var root=document.querySelector('#root');
var host=window.parent;
var esc=function(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var date=function(value){var d=new Date(value);return isNaN(d)?'':d.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})};
var nextId=0,pending={},connected=false,rendered=false;
function post(message){host.postMessage(message,'*')}
function request(method,params){var id=++nextId;post({jsonrpc:'2.0',id:id,method:method,params:params});return new Promise(function(resolve,reject){pending[id]={resolve:resolve,reject:reject}})}
function notify(method,params){post({jsonrpc:'2.0',method:method,params:params})}
function reply(id,result){post({jsonrpc:'2.0',id:id,result:result})}
function status(text){if(!rendered){root.className='status';root.textContent=text}}
function open(url){
  if(connected){request('ui/open-link',{url:url}).catch(function(){fallbackOpen(url)});return}
  if(window.openai&&window.openai.openExternal){window.openai.openExternal({href:url});return}
  fallbackOpen(url);
}
function fallbackOpen(url){try{window.open(url,'_blank','noopener,noreferrer')}catch(e){}}
function render(payload){
  if(payload&&payload.kind==='post'&&payload.post){
    var p=payload.post;
    var paragraphs=String(p.body==null?'':p.body).split(/\\n{2,}/).slice(0,6).map(function(text){return '<p>'+esc(text.replace(/^#+\\s*/,''))+'</p>'}).join('');
    root.className='';root.innerHTML='<article><p class="eyebrow">'+esc(p.categoryName)+' · '+esc(date(p.publishedAt))+'</p><h1>'+esc(p.title)+'</h1><p class="muted">'+esc(p.description)+'</p><div class="body">'+paragraphs+'</div><button id="open" type="button">Read on mattpest.com →</button></article>';
    document.querySelector('#open').onclick=function(){open(p.url)};rendered=true;return;
  }
  if(payload&&payload.kind==='resume'&&payload.resume){
    var r=payload.resume,current=(r.experience&&r.experience[0])||{};
    var highlights=(r.highlights||[]).slice(0,4).map(function(h){return '<div class="card"><strong>'+esc(h.title)+'</strong><p>'+esc(h.detail)+'</p></div>'}).join('');
    root.className='';root.innerHTML='<article><p class="eyebrow">Résumé · updated '+esc(r.updated)+'</p><h1>'+esc(r.name)+'</h1><p class="muted">'+esc(r.headline)+' · '+esc(r.location)+'</p><p>'+esc(r.summary)+'</p><div class="grid">'+highlights+'</div><p><strong>'+esc(current.title)+' · '+esc(current.org)+'</strong><br><span class="muted">'+esc(current.start)+' – '+esc(current.end)+'</span></p><button id="open" type="button">Full résumé →</button></article>';
    document.querySelector('#open').onclick=function(){open(r.website+'/en/resume')};rendered=true;return;
  }
  root.className='status';root.textContent='The tool returned no displayable content.';
}
function toolPayload(result){return result&&(result.structuredContent||result.structured_content)||result}
function applyHostContext(ctx){
  if(!ctx)return;
  var el=document.documentElement;
  if(ctx.theme){el.setAttribute('data-theme',ctx.theme);el.style.colorScheme=ctx.theme}
  var vars=ctx.styles&&ctx.styles.variables;
  if(vars)for(var name in vars)if(/^--[\\w-]+$/.test(name))el.style.setProperty(name,String(vars[name]));
}
// Keep the host's iframe sized to our content (ext-apps App.autoResize).
function reportSize(){
  var el=document.documentElement,prev=el.style.height;
  el.style.height='max-content';
  var height=Math.ceil(el.getBoundingClientRect().height);
  el.style.height=prev;
  notify('ui/notifications/size-changed',{width:Math.ceil(window.innerWidth),height:height});
}
function watchSize(){
  var scheduled=false;
  var tick=function(){if(scheduled)return;scheduled=true;(window.requestAnimationFrame||setTimeout)(function(){scheduled=false;reportSize()})};
  tick();
  if(typeof ResizeObserver==='function'){var ro=new ResizeObserver(tick);ro.observe(document.documentElement);ro.observe(document.body)}
}
window.addEventListener('message',function(event){
  if(event.source!==host)return;
  var message=event.data;
  if(!message||message.jsonrpc!=='2.0')return;
  if(message.id!==undefined&&message.method===undefined){
    var waiter=pending[message.id];if(!waiter)return;delete pending[message.id];
    if(message.error)waiter.reject(new Error(message.error.message||'Host error'));else waiter.resolve(message.result);
    return;
  }
  switch(message.method){
    case 'ui/notifications/tool-result':render(toolPayload(message.params));break;
    case 'ui/notifications/tool-input':case 'ui/notifications/tool-input-partial':status('Loading…');break;
    case 'ui/notifications/tool-cancelled':status('The tool call was cancelled.');break;
    case 'ui/notifications/host-context-changed':applyHostContext(message.params);break;
    case 'ping':case 'ui/resource-teardown':if(message.id!==undefined)reply(message.id,{});break;
    default:if(message.id!==undefined)post({jsonrpc:'2.0',id:message.id,error:{code:-32601,message:'Method not found: '+message.method}});
  }
});
// ChatGPT also exposes the tool result on window.openai; render it as soon as it exists.
function renderOpenAi(){var out=window.openai&&window.openai.toolOutput;if(out&&!rendered)render(toolPayload(out))}
window.addEventListener('openai:set_globals',renderOpenAi);
renderOpenAi();
// MCP Apps handshake (Claude, ChatGPT, VS Code, …).
request('ui/initialize',{appInfo:{name:'mattpest.com',version:'1.0.0'},appCapabilities:{},protocolVersion:PROTOCOL_VERSION})
  .then(function(result){connected=true;notify('ui/notifications/initialized');applyHostContext(result&&result.hostContext);watchSize();status('Waiting for the tool result…')})
  .catch(function(error){status('Unable to connect to the host: '+error.message)});
})();
</script></body></html>`;
}

/** The `resources/read` payload for any widget URI, with CSP metadata for both host dialects. */
export function widgetResource(uri: string, origin: string) {
  return {
    contents: [
      {
        uri,
        mimeType: RESOURCE_MIME_TYPE,
        text: widgetHtml(),
        _meta: {
          ui: { csp: { connectDomains: [origin], resourceDomains: [origin, MEDIA_ORIGIN] } },
          'openai/widgetCSP': { connect_domains: [origin], resource_domains: [origin, MEDIA_ORIGIN] },
          'openai/widgetDescription': "Matt Pest's interactive site content",
        },
      },
    ],
  };
}

/** Tool `_meta` that points hosts (standard MCP Apps and ChatGPT's alias) at the widget. */
export const WIDGET_TOOL_META = {
  ui: { resourceUri: WIDGET_URI },
  'openai/outputTemplate': WIDGET_URI,
} as const;

/**
 * Register the widget: the canonical URI (listed in `resources/list`) plus a
 * template that resolves every other `ui://mattpest/...` URI, so hosts holding
 * a tool descriptor from an earlier deployment can still read the template.
 */
export function registerWidgetResources(server: McpServer, origin: () => string) {
  registerAppResource(server, 'mattpest-widget', WIDGET_URI, { mimeType: RESOURCE_MIME_TYPE }, async (uri) =>
    widgetResource(uri.href, origin())
  );
  server.registerResource(
    'mattpest-widget-legacy',
    new ResourceTemplate(WIDGET_URI_TEMPLATE, { list: undefined }),
    { mimeType: RESOURCE_MIME_TYPE },
    async (uri) => widgetResource(uri.href, origin())
  );
}
