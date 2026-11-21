/**
 * Connexion au serveur gRPC depuis le navigateur.
 *
 * Un navigateur ne peut pas parler gRPC « natif » (il n'a pas accès aux trames HTTP/2
 * ni aux trailers). On utilise donc le protocole gRPC-Web, que le serveur Armeria
 * comprend directement sur le même port 9090 : pas besoin de proxy Envoy.
 */
import { signal } from '@angular/core';
import { Code, ConnectError, createClient, type Interceptor } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { toBinary, toJsonString, type DescMessage, type MessageShape } from '@bufbuild/protobuf';
import { PersonneService } from '../gen/personne_pb';

const STORAGE_KEY = 'grpc-server-url';
export const DEFAULT_URL = 'http://localhost:9090';

function readUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
  } catch {
    return DEFAULT_URL;
  }
}

export const serverUrl = readUrl();

export function changeServerUrl(url: string): void {
  try {
    if (url.trim() && url.trim() !== DEFAULT_URL) localStorage.setItem(STORAGE_KEY, url.trim());
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* stockage indisponible */
  }
  location.reload();
}

/* ------------------------------------------------------------------ */
/* Journal des appels unaires (pour le laboratoire)                    */
/* ------------------------------------------------------------------ */

export interface WireInfo {
  json: string;
  jsonBytes: number;
  protoBytes: Uint8Array;
}

export interface CallRecord {
  seq: number;
  method: string;
  at: Date;
  ms: number;
  status: string; // OK, NOT_FOUND, INVALID_ARGUMENT…
  statusCode: number;
  message?: string;
  request: WireInfo;
  response?: WireInfo;
}

let seq = 0;
export const calls = signal<CallRecord[]>([]);

export function wire<D extends DescMessage>(schema: D, msg: MessageShape<D>): WireInfo {
  const json = toJsonString(schema, msg, { prettySpaces: 2 });
  return { json, jsonBytes: new TextEncoder().encode(toJsonString(schema, msg)).length, protoBytes: toBinary(schema, msg) };
}

/** Nom canonique gRPC d'un code (Code.NotFound → NOT_FOUND). */
export function statusName(code: number): string {
  if (code === 0) return 'OK';
  const name = Code[code] ?? 'UNKNOWN';
  return name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
}

/** Intercepteur Connect : mesure et journalise chaque appel unaire. */
const journal: Interceptor = (next) => async (req) => {
  if (req.stream) return next(req); // les flux (Suivre) sont affichés dans le panneau dédié
  const t0 = performance.now();
  const base = {
    method: req.method.name,
    at: new Date(),
    request: wire(req.method.input, req.message as never),
  };
  try {
    const res = await next(req);
    const record: CallRecord = {
      ...base,
      seq: ++seq,
      ms: Math.round(performance.now() - t0),
      status: 'OK',
      statusCode: 0,
      response: res.stream ? undefined : wire(req.method.output, res.message as never),
    };
    calls.update((list) => [record, ...list].slice(0, 50));
    return res;
  } catch (e) {
    const err = ConnectError.from(e);
    calls.update((list) =>
      [
        {
          ...base,
          seq: ++seq,
          ms: Math.round(performance.now() - t0),
          status: statusName(err.code),
          statusCode: err.code,
          message: err.rawMessage,
        },
        ...list,
      ].slice(0, 50),
    );
    throw e;
  }
};

export const transport = createGrpcWebTransport({
  baseUrl: serverUrl,
  interceptors: [journal],
});

/** Client typé généré à partir de personne.proto */
export const client = createClient(PersonneService, transport);

/** Message lisible pour l'utilisateur : « NOT_FOUND · Aucune personne avec l'id 9 » */
export function describeError(e: unknown): string {
  if (isUnavailable(e)) return `UNAVAILABLE · serveur gRPC injoignable (${serverUrl})`;
  const err = ConnectError.from(e);
  return `${statusName(err.code)} · ${err.rawMessage}`;
}

export function isUnavailable(e: unknown): boolean {
  const err = ConnectError.from(e);
  return err.code === Code.Unavailable || (err.code === Code.Unknown && /fetch|network/i.test(err.rawMessage));
}

/** 0a 04 44 49 4f 50 … */
export function hex(bytes: Uint8Array, max = 160): string {
  const parts = Array.from(bytes.slice(0, max), (b) => b.toString(16).padStart(2, '0'));
  return parts.join(' ') + (bytes.length > max ? ' …' : '');
}

/** En-tête de trame gRPC / gRPC-Web : 1 octet d'indicateur + 4 octets de longueur */
export function frameHeader(length: number): string {
  const h = [0, (length >>> 24) & 255, (length >>> 16) & 255, (length >>> 8) & 255, length & 255];
  return h.map((b) => b.toString(16).padStart(2, '0')).join(' ');
}
