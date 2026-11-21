# Annuaire gRPC — client Angular

Client **Angular 21** (composants autonomes, signaux, sans zone.js) pour le service **gRPC**
du TP « Gestion des personnes ». Il parle au serveur en **gRPC-Web** grâce à
[Connect-ES](https://connectrpc.com/) ; le code client est **généré** depuis `../proto/personne.proto`.

## Démarrage

```bash
npm install
npm start          # http://localhost:4200 — le serveur doit tourner sur localhost:9090
```

| Script             | Rôle                                                              |
| ------------------ | ----------------------------------------------------------------- |
| `npm start`        | serveur de développement (port 4200)                              |
| `npm run build`    | build de production dans `dist/`                                  |
| `npm run generate` | régénère `src/app/gen/personne_pb.ts` depuis le `.proto` (buf)    |

L’adresse du serveur se change dans **Laboratoire → Serveur gRPC-Web** (utile pour viser la machine
d’un autre étudiant sur le réseau local).

## Fonctionnalités

- **Annuaire** : cartes des personnes (`Lister`), ajout et modification dans une fenêtre qui montre
  le message Protobuf construit et sa taille, suppression avec confirmation.
- **Flux en direct** (panneau de droite) : abonnement permanent à `Suivre()` (*streaming serveur*).
  Une personne ajoutée depuis Postman apparaît instantanément et la carte concernée clignote.
- **Recherche** par id, avec l’échange requête/réponse et le statut `NOT_FOUND`.
- **Laboratoire** : écrire un message JSON, l’envoyer, et comparer la taille JSON / Protobuf,
  voir les octets et l’en-tête de trame gRPC-Web (1 octet d’indicateur + 4 octets de longueur).

## Architecture

```
src/app/
├── gen/personne_pb.ts      # GÉNÉRÉ par buf + protoc-gen-es (ne pas modifier)
├── core/
│   ├── grpc.ts             # transport gRPC-Web, client typé, intercepteur de journalisation
│   ├── personnes.store.ts  # état (signaux) : Lister + mise à jour par le flux Suivre()
│   ├── ui.ts, toasts.ts, format.ts
├── components/             # flux-panel, personne-dialog, confirm-dialog, avatar, toast-stack
├── pages/                  # annuaire, recherche, labo
└── app.ts / app.html       # en-tête, navigation, mise en page
```

Extrait — appeler le service est aussi simple qu’un appel de fonction typé :

```ts
const transport = createGrpcWebTransport({ baseUrl: 'http://localhost:9090' });
const client = createClient(PersonneService, transport);

const { personnes } = await client.lister({});
for await (const ev of client.suivre({})) { /* AJOUT, MODIFICATION, SUPPRESSION */ }
```
