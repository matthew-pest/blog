/**
 * A deliberately dependency-free resource document. MCP hosts sandbox app
 * HTML, so a Next.js page (and its hydration chunks) is not a portable MCP
 * resource. Keeping the tiny host bridge here also means resources/read never
 * depends on node_modules being present in a serverless function at runtime.
 */
export function widgetHtml(): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{color-scheme:light dark;font-family:system-ui,sans-serif}*{box-sizing:border-box}body{margin:0;padding:8px;background:transparent;color:var(--color-text-primary,currentColor)}article{max-width:680px;padding:20px;border:1px solid var(--color-border-secondary,#7775);border-radius:16px;background:var(--color-background-primary,#fff1)}.eyebrow{margin:0 0 8px;text-transform:uppercase;letter-spacing:.08em;font-size:12px;opacity:.7}h1{margin:0 0 8px;font-size:24px;line-height:1.15}p{line-height:1.5}.muted{opacity:.72}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin:18px 0}.card{padding:12px;border:1px solid var(--color-border-secondary,#7775);border-radius:12px}.card p{margin:4px 0 0;font-size:12px}.body{max-height:320px;overflow:auto}button{padding:9px 15px;border:0;border-radius:999px;background:var(--color-background-inverse,#111);color:var(--color-text-inverse,#fff);font:inherit;cursor:pointer}.status{padding:20px;opacity:.7}
</style></head><body><div id="root" class="status">Connecting to host…</div>
<script>
const root=document.querySelector('#root');
const esc=(value)=>String(value??'').replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const date=(value)=>new Date(value).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
let requestId=0;
const pending=new Map();
function send(method,params){const id=++requestId;parent.postMessage({jsonrpc:'2.0',id,method,params},'*');return new Promise((resolve,reject)=>pending.set(id,{resolve,reject}))}
function notify(method,params){parent.postMessage({jsonrpc:'2.0',method,params},'*')}
function open(url){
  if(window.openai?.openExternal){window.openai.openExternal({href:url});return}
  send('ui/open-link',{url}).catch(()=>window.open(url,'_blank','noopener,noreferrer'));
}
function render(payload){
  if(payload?.kind==='post'){
    const p=payload.post;
    const paragraphs=String(p.body??'').split(/\\n{2,}/).slice(0,6).map((text)=>'<p>'+esc(text.replace(/^#+\\s*/,''))+'</p>').join('');
    root.className='';root.innerHTML='<article><p class="eyebrow">'+esc(p.categoryName)+' · '+esc(date(p.publishedAt))+'</p><h1>'+esc(p.title)+'</h1><p class="muted">'+esc(p.description)+'</p><div class="body">'+paragraphs+'</div><button id="open">Read on mattpest.com →</button></article>';
    document.querySelector('#open').onclick=()=>open(p.url);return;
  }
  if(payload?.kind==='resume'){
    const r=payload.resume,current=r.experience?.[0]??{};
    const highlights=(r.highlights??[]).slice(0,4).map((h)=>'<div class="card"><strong>'+esc(h.title)+'</strong><p>'+esc(h.detail)+'</p></div>').join('');
    root.className='';root.innerHTML='<article><p class="eyebrow">Résumé · updated '+esc(r.updated)+'</p><h1>'+esc(r.name)+'</h1><p class="muted">'+esc(r.headline)+' · '+esc(r.location)+'</p><p>'+esc(r.summary)+'</p><div class="grid">'+highlights+'</div><p><strong>'+esc(current.title)+' · '+esc(current.org)+'</strong><br><span class="muted">'+esc(current.start)+' – '+esc(current.end)+'</span></p><button id="open">Full résumé →</button></article>';
    document.querySelector('#open').onclick=()=>open(r.website+'/en/resume');return;
  }
  root.textContent='The tool returned no displayable content.';
}
function toolPayload(result){return result?.structuredContent??result?.structured_content??result}
function renderOpenAi(){const payload=window.openai?.toolOutput;if(payload)render(toolPayload(payload))}
window.addEventListener('openai:set_globals',renderOpenAi);
window.addEventListener('message',(event)=>{
  const message=event.data;if(!message||message.jsonrpc!=='2.0')return;
  if(message.id!==undefined&&pending.has(message.id)){
    const waiter=pending.get(message.id);pending.delete(message.id);
    message.error?waiter.reject(new Error(message.error.message)):waiter.resolve(message.result);return;
  }
  if(message.method==='ui/notifications/tool-result')render(toolPayload(message.params));
});
if(window.openai){renderOpenAi();if(!window.openai.toolOutput)root.textContent='Waiting for the tool result…'}
else send('ui/initialize',{protocolVersion:'2025-06-18',appInfo:{name:'mattpest.com',version:'1.0.0'},capabilities:{}})
  .then(()=>{notify('ui/notifications/initialized');root.textContent='Waiting for the tool result…'})
  .catch((error)=>{root.textContent='Unable to connect to the host: '+error.message});
</script></body></html>`;
}

export function widgetResource(uri: string, mimeType: string, origin: string) {
  return {
    contents: [{
      uri,
      mimeType,
      text: widgetHtml(),
      _meta: {
        ui: { csp: { connectDomains: [origin], resourceDomains: [origin, 'https://elasticbeanstalk-us-east-2-641171614455.s3.us-east-2.amazonaws.com'] } },
        'openai/widgetCSP': {
          connect_domains: [origin],
          resource_domains: [origin, 'https://elasticbeanstalk-us-east-2-641171614455.s3.us-east-2.amazonaws.com'],
        },
        'openai/widgetDomain': origin,
        'openai/widgetDescription': "Matt Pest's interactive site content",
      },
    }],
  };
}
