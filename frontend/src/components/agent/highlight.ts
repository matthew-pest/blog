/**
 * Find a passage on the page (whitespace-insensitive, case-insensitive) and
 * highlight it with the CSS Custom Highlight API, falling back to a <mark>.
 * Returns true when the passage was found.
 */
export function highlightPassage(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const needle = text.replace(/\s+/g, ' ').trim().toLowerCase();
  if (needle.length < 3) return false;

  const root = document.querySelector('main') ?? document.body;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.parentElement?.closest('script,style,noscript,[data-agent-dock],header,footer')
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });

  // Concatenate all text, collapsing whitespace, while remembering where each
  // normalised character came from (node + offset).
  const origin: { node: Text; offset: number }[] = [];
  let normalised = '';
  let lastWasSpace = true;
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const t = node as Text;
    const value = t.nodeValue ?? '';
    for (let i = 0; i < value.length; i++) {
      const ch = value[i];
      if (/\s/.test(ch)) {
        if (lastWasSpace) continue;
        normalised += ' ';
        origin.push({ node: t, offset: i });
        lastWasSpace = true;
      } else {
        normalised += ch.toLowerCase();
        origin.push({ node: t, offset: i });
        lastWasSpace = false;
      }
    }
  }

  const start = normalised.indexOf(needle);
  if (start < 0) return false;
  const endIdx = start + needle.length - 1;
  const from = origin[start];
  const to = origin[endIdx];
  if (!from || !to) return false;

  const range = document.createRange();
  range.setStart(from.node, from.offset);
  range.setEnd(to.node, to.offset + 1);

  const css = CSS as unknown as { highlights?: Map<string, unknown> };
  const HighlightCtor = (globalThis as unknown as { Highlight?: new (...r: Range[]) => unknown }).Highlight;
  if (css.highlights && HighlightCtor) {
    css.highlights.set('agent-highlight', new HighlightCtor(range));
  } else {
    // Fallback: only safe when the range lives in one text node.
    document.querySelectorAll('mark.mark-agent').forEach((m) => {
      const parent = m.parentNode;
      if (!parent) return;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
    });
    if (from.node === to.node) {
      const mark = document.createElement('mark');
      mark.className = 'mark-agent';
      range.surroundContents(mark);
    }
  }

  const rect = range.getBoundingClientRect();
  const top = rect.top + window.scrollY - Math.max(96, window.innerHeight * 0.3);
  window.scrollTo({ top, behavior: 'smooth' });
  return true;
}

export function clearHighlight() {
  const css = CSS as unknown as { highlights?: Map<string, unknown> };
  css.highlights?.delete('agent-highlight');
}
