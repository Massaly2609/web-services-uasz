/**
 * Coloration syntaxique XML très légère : le texte est échappé AVANT
 * d'insérer les <span>, le résultat est donc sûr pour dangerouslySetInnerHTML.
 */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function highlightXml(xml: string): string {
  let lastTag = ''
  return xml.replace(/<[^>]+>|[^<]+/g, (tok) => {
    if (tok.startsWith('<?') || tok.startsWith('<!')) {
      return `<span class="x-decl">${esc(tok)}</span>`
    }
    if (tok.startsWith('<')) {
      const m = /^<(\/?)([^\s/>]+)([\s\S]*?)(\/?)>$/.exec(tok)
      if (!m) return esc(tok)
      const [, close, name, rawAttrs, selfClose] = m
      lastTag = close || selfClose ? '' : name
      const attrs = esc(rawAttrs).replace(
        /([\w:.-]+)=("[^"]*")/g,
        '<span class="x-attr">$1</span>=<span class="x-str">$2</span>',
      )
      return (
        `<span class="x-punc">&lt;${close}</span><span class="x-tag">${esc(name)}</span>` +
        `${attrs}<span class="x-punc">${selfClose}&gt;</span>`
      )
    }
    if (!tok.trim()) return tok
    const cls =
      lastTag === 'methodName' ? 'x-method' : lastTag === 'name' ? 'x-member' : 'x-text'
    return `<span class="${cls}">${esc(tok)}</span>`
  })
}

/** Coloration JSON (résultat décodé). */
export function highlightJson(value: unknown): string {
  const json = JSON.stringify(value, null, 2) ?? 'null'
  return esc(json).replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (m, str: string | undefined, colon: string | undefined, bool: string | undefined) => {
      if (str) return colon ? `<span class="j-key">${str}</span>${colon}` : `<span class="j-str">${str}</span>`
      if (bool) return `<span class="j-bool">${m}</span>`
      if (m === 'null') return `<span class="j-null">${m}</span>`
      return `<span class="j-num">${m}</span>`
    },
  )
}
