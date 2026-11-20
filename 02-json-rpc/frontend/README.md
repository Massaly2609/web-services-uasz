# Carnet JSON-RPC — client Vue 3

Client web **Vue 3 (Composition API) + TypeScript + Vite** pour le service **JSON-RPC 2.0** du TP
« Gestion des personnes » (backend Spring Boot, contrôleur `JsonRpcController`, base H2 en mémoire).

> Serveur en Java, client en Vue/TypeScript : technologie différente du serveur, et différente
> du client XML-RPC (React) pour comparer deux frameworks.

## Démarrage

```bash
# 1. Backend (dans 02-json-rpc/backend) — écoute sur http://localhost:8082/jsonrpc
./mvnw spring-boot:run          # ou lancer JsonRpcApplication depuis IntelliJ

# 2. Frontend (dans 02-json-rpc/frontend)
npm install
npm run dev                     # http://localhost:5174
```

| Script              | Rôle                                           |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | serveur de développement + proxy `/jsonrpc`    |
| `npm run build`     | vérification `vue-tsc` puis build de prod      |
| `npm run typecheck` | vérification des types (fichiers `.vue` inclus) |
| `npm run preview`   | sert le build (`dist/`) avec le même proxy     |

## Fonctionnalités

- **Aperçu** : dernier échange JSON en direct, indicateurs, méthodes exposées, codes d’erreur
  de la spécification (surlignés quand ils ont été rencontrés), répartition par ville.
- **Personnes** : cartes ou tableau, filtre (`/`), tri, ajout / modification dans une modale qui
  affiche **l’enveloppe JSON-RPC générée en direct**, suppression avec confirmation.
- **Recherche** : par identifiant, avec l’échange requête / réponse.
- **Playground** : éditeur JSON (comme Postman) avec exemples prêts à l’emploi, y compris un
  exemple par code d’erreur (-32600, -32601, -32602, -32603, JSON invalide) et une explication.
- **Inspecteur** (bouton en haut à droite) : flux de tous les appels avec statistiques et détail.
- Thème sombre / clair, responsive, resynchronisation au retour sur l’onglet.

## Comment le client parle au serveur

Tout est dans [`src/api/jsonrpc.ts`](src/api/jsonrpc.ts) (simple `fetch`, aucune librairie) :

```jsonc
// Requête : POST /jsonrpc, Content-Type: application/json
{ "jsonrpc": "2.0", "method": "Personne.rechercher", "params": { "id": 1 }, "id": 2 }

// Succès
{ "jsonrpc": "2.0", "result": { "id": 1, "nom": "DIOP", … }, "id": 2 }

// Erreur (toujours HTTP 200)
{ "jsonrpc": "2.0", "error": { "code": -32602, "message": "Personne introuvable" }, "id": 2 }
```

À retenir :

- Paramètres **nommés** (objet JSON), contrairement aux paramètres positionnels de XML-RPC.
- Chaque requête porte un `id` incrémental ; le serveur le renvoie tel quel (sauf `-32600` : `id: null`).
- Le document de TP contient une coquille dans *Modifier* (`dateNaissancee`) → erreur `-32602`.
- Un corps qui n’est pas du JSON est rejeté par Spring en **HTTP 400** avant le contrôleur ;
  la spécification prévoit plutôt `-32700 Parse error` (piste d’amélioration du serveur).
- **CORS** : le backend n’a pas de configuration CORS, la requête pré-vérifiée `OPTIONS`
  échouerait. Le **proxy Vite** ([`vite.config.ts`](vite.config.ts)) relaie `/jsonrpc` vers
  `http://localhost:8082`. Pour un autre serveur : `JSONRPC_TARGET=http://… npm run dev`.

## Architecture

```
src/
├── api/
│   ├── jsonrpc.ts          # enveloppe 2.0, transport, erreurs (JsonRpcError / TransportError)
│   └── personneService.ts  # les 5 méthodes typées
├── stores/                 # état réactif sans Pinia : personnes, inspecteur, notifications, UI
├── components/             # AppHeader, PersonEditor, ConfirmDelete, InspectorDrawer, JsonBlock…
├── views/                  # ApercuView, PersonnesView, RechercheView, PlaygroundView
├── lib/format.ts           # dates, âge, téléphone, validation, coloration JSON
└── styles/main.css         # design system (variables CSS, thèmes sombre/clair)
```

## Tests Postman

La collection [`../postman/JSON-RPC_Gestion_Personnes.postman_collection.json`](../postman/JSON-RPC_Gestion_Personnes.postman_collection.json)
contient le scénario CRUD complet (tests automatiques, variable `personneId`) et un exemple
par code d’erreur. Importer le fichier dans Postman puis lancer le *Collection Runner*.
