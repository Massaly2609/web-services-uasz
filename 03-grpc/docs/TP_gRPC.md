# TP gRPC — Gestion des personnes

**Exposé gRPC** — Medoune MASSALY & Alioune DIOUF · Master 1 Web Services · UASZ

Comme pour XML-RPC et JSON-RPC, le service expose une ressource `Personne` avec les méthodes
**Ajouter, Lister, Rechercher, Modifier, Supprimer**. En gRPC, ces méthodes sont décrites dans un
contrat **Protocol Buffers** : [`proto/personne.proto`](../proto/personne.proto).

## 1. Démarrer le serveur

```bash
cd 03-grpc/backend
./mvnw spring-boot:run        # Windows : mvnw.cmd spring-boot:run   (ou lancer GrpcApplication dans IntelliJ)
```

Le serveur écoute sur **`localhost:9090`** (gRPC en clair, sans TLS). Trois personnes d’exemple
sont créées au démarrage. Page de test intégrée : <http://localhost:9090/docs>.

## 2. Tester avec Postman

1. **New → gRPC**.
2. URL du serveur : `localhost:9090` (sans `http://`, cadenas TLS **désactivé**).
3. Onglet *Service definition* : **Using server reflection**
   (ou *Import .proto file* → `03-grpc/proto/personne.proto`).
4. Choisir la méthode `uasz.personne.v1.PersonneService / …`, coller le message dans l’onglet
   **Message**, puis **Invoke**.

> Les noms de champs peuvent s’écrire `date_naissance` (comme dans le `.proto`) ou `dateNaissance` :
> la conversion JSON → Protobuf accepte les deux. Les `int64` (id) peuvent être des nombres ou des chaînes.

### Ajouter une personne — `Ajouter`

```json
{
  "nom": "DIOP",
  "prenom": "Amadou",
  "date_naissance": "2000-05-15",
  "adresse": "Ziguinchor",
  "telephone": "771234567"
}
```

Réponse : la `Personne` créée, avec son `id`.

### Lister les personnes — `Lister`

```json
{}
```

Réponse : `{ "personnes": [ … ], "total": 4 }`.

### Rechercher une personne — `Rechercher`

```json
{ "id": 1 }
```

### Modifier une personne — `Modifier`

```json
{
  "id": 1,
  "nom": "DIOP",
  "prenom": "Amadou",
  "date_naissance": "2000-05-15",
  "adresse": "Dakar",
  "telephone": "779876543"
}
```

### Supprimer une personne — `Supprimer`

```json
{ "id": 1 }
```

Réponse : `{ "supprime": true }`.

## 3. Les erreurs : des codes de statut gRPC

En gRPC, une erreur n’est pas un objet JSON dans la réponse : l’appel se termine avec un **statut**.

| Cas                                    | Statut                 | Exemple de message                                   |
| -------------------------------------- | ---------------------- | ---------------------------------------------------- |
| `Rechercher` avec `{ "id": 9999 }`      | `NOT_FOUND` (5)        | Aucune personne avec l'id 9999                       |
| `Ajouter` avec `"date_naissance": "15/05/2000"` | `INVALID_ARGUMENT` (3) | date_naissance invalide … (format attendu : yyyy-MM-dd) |
| `Ajouter` sans `nom`                   | `INVALID_ARGUMENT` (3) | Champ obligatoire manquant : nom                     |
| `Supprimer` avec `{ "id": 0 }`          | `INVALID_ARGUMENT` (3) | L'id doit être un entier positif                     |
| Méthode inexistante                    | `UNIMPLEMENTED` (12)   | —                                                    |
| Serveur arrêté                         | `UNAVAILABLE` (14)     | —                                                    |

## 4. Aller plus loin : le streaming (spécificité de gRPC)

| Type                     | Méthode            | Comment tester dans Postman                                                              |
| ------------------------ | ------------------ | ---------------------------------------------------------------------------------------- |
| Streaming serveur        | `Suivre`           | Message `{}` puis **Invoke** : l’appel reste ouvert. Dans un 2ᵉ onglet, faites `Ajouter` : l’événement arrive en direct. |
| Streaming client         | `Importer`         | **Invoke**, puis envoyez plusieurs messages `AjouterRequest` avec **Send**, et terminez par **End streaming** : le serveur répond un bilan `{ ajoutees, rejetees, ids, erreurs }`. |
| Bidirectionnel           | `RechercherEnFlux` | **Invoke**, puis envoyez `{ "id": 1 }`, `{ "id": 9999 }`… : chaque message reçoit sa réponse `{ id, trouve, personne }`. |

Le premier message de `Suivre` est de type `ABONNEMENT` : il confirme que l’abonnement est ouvert.

## 5. Travail demandé

1. Lancer le serveur et tester les **5 méthodes** et **au moins deux cas d’erreur** dans Postman.
2. Créer un **client dans une technologie différente** du serveur (Java) qui appelle les méthodes exposées.
   Pistes :
   - **Navigateur** (React, Vue, Angular, Svelte…) : utiliser **gRPC-Web**. Le serveur l’accepte
     directement sur le même port 9090 et autorise CORS : aucun proxy à installer.
     Exemple : [Connect-ES](https://connectrpc.com/docs/web/getting-started) avec
     `createGrpcWebTransport({ baseUrl: "http://localhost:9090" })`.
   - **Python** : `grpcio-tools` génère le client depuis `personne.proto`.
   - **Node.js** : `@grpc/grpc-js` + `@grpc/proto-loader`.
   - **Go, C#, Kotlin, Dart…** : `protoc` + le plugin du langage.
3. Point de départ : le contrat [`proto/personne.proto`](../proto/personne.proto) — c’est lui qui
   permet de générer le code client, quel que soit le langage.

Notre propre client (Angular) se trouve dans [`03-grpc/frontend`](../frontend/).
