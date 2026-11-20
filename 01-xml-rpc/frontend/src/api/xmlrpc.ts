/**
 * Client XML-RPC minimal, écrit à la main (aucune librairie) pour montrer
 * exactement ce qui circule sur le réseau :
 *   requête  = POST text/xml  <methodCall>…</methodCall>
 *   réponse  = 200 text/xml   <methodResponse><params>…</params></methodResponse>
 *                          ou <methodResponse><fault>…</fault></methodResponse>
 */
import { recordCall } from './inspector'

export const XMLRPC_ENDPOINT: string = import.meta.env.VITE_XMLRPC_URL ?? '/RPC2'

export type XmlRpcValue =
  | string
  | number
  | boolean
  | null
  | XmlRpcValue[]
  | { [key: string]: XmlRpcValue }

/** Erreur renvoyée par le serveur dans un bloc <fault>. */
export class XmlRpcFault extends Error {
  readonly faultCode: number
  constructor(faultCode: number, faultString: string) {
    super(faultString)
    this.name = 'XmlRpcFault'
    this.faultCode = faultCode
  }
}

/** Erreur de transport (serveur arrêté, proxy, HTTP ≠ 200, XML illisible). */
export class XmlRpcTransportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'XmlRpcTransportError'
  }
}

/* ------------------------------------------------------------------ */
/* Encodage                                                            */
/* ------------------------------------------------------------------ */

const escapeXml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

function encodeValue(value: XmlRpcValue, depth: number): string {
  const pad = '  '.repeat(depth)
  if (value === null) return '<value><nil/></value>'
  if (typeof value === 'boolean') return `<value><boolean>${value ? 1 : 0}</boolean></value>`
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? `<value><int>${value}</int></value>`
      : `<value><double>${value}</double></value>`
  }
  if (typeof value === 'string') return `<value><string>${escapeXml(value)}</string></value>`
  if (Array.isArray(value)) {
    const items = value.map((v) => `${pad}    ${encodeValue(v, depth + 2)}`).join('\n')
    return `<value>\n${pad}  <array><data>\n${items}\n${pad}  </data></array>\n${pad}</value>`
  }
  const members = Object.entries(value)
    .map(
      ([k, v]) =>
        `${pad}    <member><name>${escapeXml(k)}</name>${encodeValue(v, depth + 2)}</member>`,
    )
    .join('\n')
  return `<value>\n${pad}  <struct>\n${members}\n${pad}  </struct>\n${pad}</value>`
}

/** Construit le document <methodCall> (indenté comme dans le TP). */
export function buildMethodCall(methodName: string, params: XmlRpcValue[]): string {
  const body =
    params.length === 0
      ? '    <params/>'
      : [
          '    <params>',
          ...params.map(
            (p) => `        <param>\n            ${encodeValue(p, 3)}\n        </param>`,
          ),
          '    </params>',
        ].join('\n')
  return [
    '<?xml version="1.0"?>',
    '<methodCall>',
    `    <methodName>${escapeXml(methodName)}</methodName>`,
    body,
    '</methodCall>',
  ].join('\n')
}

/* ------------------------------------------------------------------ */
/* Décodage (DOMParser — plus robuste que des expressions régulières)  */
/* ------------------------------------------------------------------ */

const elementChildren = (el: Element) => Array.from(el.children)

function decodeValue(valueEl: Element): XmlRpcValue {
  const typed = valueEl.firstElementChild
  // Spécification XML-RPC : une <value> sans type est une chaîne.
  // Apache XML-RPC renvoie ainsi les String : <value>DIOP</value>
  if (!typed) return valueEl.textContent ?? ''

  const text = typed.textContent ?? ''
  switch (typed.localName) {
    // localName ignore le préfixe : <ex:i8> → "i8" (extensions Apache)
    case 'string':
      return text
    case 'int':
    case 'i4':
    case 'i8':
    case 'i2':
    case 'i1':
    case 'biginteger':
      return Number.parseInt(text, 10)
    case 'double':
    case 'float':
    case 'bigdecimal':
      return Number.parseFloat(text)
    case 'boolean':
      return text.trim() === '1' || text.trim().toLowerCase() === 'true'
    case 'nil':
      return null
    case 'dateTime.iso8601':
    case 'dateTime':
    case 'base64':
      return text
    case 'array': {
      const data = typed.getElementsByTagName('data')[0]
      return data ? elementChildren(data).map(decodeValue) : []
    }
    case 'struct': {
      const obj: Record<string, XmlRpcValue> = {}
      for (const member of elementChildren(typed)) {
        const name = member.getElementsByTagName('name')[0]?.textContent ?? ''
        const v = elementChildren(member).find((c) => c.localName === 'value')
        obj[name] = v ? decodeValue(v) : null
      }
      return obj
    }
    default:
      return text
  }
}

function parseMethodResponse(xml: string): XmlRpcValue {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new XmlRpcTransportError('Réponse XML illisible')
  }
  const root = doc.documentElement
  const fault = elementChildren(root).find((c) => c.localName === 'fault')
  if (fault) {
    const v = fault.firstElementChild
    const f = (v ? decodeValue(v) : {}) as Record<string, XmlRpcValue>
    throw new XmlRpcFault(Number(f.faultCode ?? 0), String(f.faultString ?? 'Erreur inconnue'))
  }
  const firstValue = root.getElementsByTagName('param')[0]?.firstElementChild
  return firstValue ? decodeValue(firstValue) : null
}

/* ------------------------------------------------------------------ */
/* Pretty-print (pour l'inspecteur)                                    */
/* ------------------------------------------------------------------ */

/** Réindente un document XML ; les feuilles <value><x>…</x></value> restent sur une ligne. */
export function formatXml(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  if (doc.getElementsByTagName('parsererror').length > 0) return xml.trim()

  const open = (el: Element) => {
    const attrs = Array.from(el.attributes)
      .map((a) => ` ${a.name}="${escapeXml(a.value)}"`)
      .join('')
    return `<${el.tagName}${attrs}`
  }
  const isLeaf = (el: Element) => el.children.length === 0
  const inline = (el: Element): string => {
    if (isLeaf(el)) {
      const t = el.textContent ?? ''
      return t === '' ? `${open(el)}/>` : `${open(el)}>${escapeXml(t)}</${el.tagName}>`
    }
    return `${open(el)}>${elementChildren(el).map(inline).join('')}</${el.tagName}>`
  }
  // Une <value> contenant une feuille typée tient sur une ligne
  const canInline = (el: Element): boolean =>
    isLeaf(el) ||
    (el.children.length === 1 && isLeaf(el.children[0]) && el.localName !== 'params')
  const lines: string[] = []
  const walk = (el: Element, depth: number) => {
    const pad = '    '.repeat(depth)
    if (canInline(el) || (el.localName === 'member' && canInline(el.children[1] ?? el))) {
      lines.push(pad + inline(el))
      return
    }
    lines.push(`${pad}${open(el)}>`)
    for (const c of elementChildren(el)) walk(c, depth + 1)
    lines.push(`${pad}</${el.tagName}>`)
  }
  walk(doc.documentElement, 0)
  const decl = xml.trim().match(/^<\?xml[^>]*\?>/)?.[0] ?? '<?xml version="1.0"?>'
  return `${decl}\n${lines.join('\n')}`
}

/* ------------------------------------------------------------------ */
/* Transport                                                           */
/* ------------------------------------------------------------------ */

export interface RawResult {
  httpStatus: number | null
  responseXml: string | null
  durationMs: number
}

async function post(xml: string): Promise<RawResult> {
  const t0 = performance.now()
  let res: Response
  try {
    res = await fetch(XMLRPC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      body: xml,
    })
  } catch {
    throw new XmlRpcTransportError('Serveur XML-RPC injoignable')
  }
  const text = await res.text()
  return {
    httpStatus: res.status,
    responseXml: text,
    durationMs: Math.round(performance.now() - t0),
  }
}

/** Appel typé : encode, envoie, décode, et journalise dans l'inspecteur. */
export async function call<T = XmlRpcValue>(method: string, params: XmlRpcValue[] = []): Promise<T> {
  const requestXml = buildMethodCall(method, params)
  return execute(method, requestXml) as Promise<T>
}

/** Envoie un document XML saisi à la main (console). */
export async function callRaw(requestXml: string): Promise<XmlRpcValue> {
  const method =
    new DOMParser()
      .parseFromString(requestXml, 'text/xml')
      .getElementsByTagName('methodName')[0]?.textContent?.trim() || '(XML brut)'
  return execute(method, requestXml)
}

async function execute(method: string, requestXml: string): Promise<XmlRpcValue> {
  const startedAt = new Date()
  let raw: RawResult | null = null
  try {
    raw = await post(requestXml)
    if (raw.httpStatus !== 200) {
      throw new XmlRpcTransportError(
        raw.httpStatus && raw.httpStatus >= 500
          ? `Serveur XML-RPC injoignable (HTTP ${raw.httpStatus})`
          : `Erreur HTTP ${raw.httpStatus}`,
      )
    }
    const result = parseMethodResponse(raw.responseXml ?? '')
    recordCall({ method, requestXml, startedAt, ...raw, outcome: 'ok', result })
    return result
  } catch (err) {
    const outcome = err instanceof XmlRpcFault ? 'fault' : 'error'
    recordCall({
      method,
      requestXml,
      startedAt,
      httpStatus: raw?.httpStatus ?? null,
      responseXml: raw?.responseXml ?? null,
      durationMs: raw?.durationMs ?? 0,
      outcome,
      error: err instanceof Error ? err.message : String(err),
      faultCode: err instanceof XmlRpcFault ? err.faultCode : undefined,
    })
    throw err
  }
}
