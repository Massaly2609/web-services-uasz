# 03 · gRPC

Exposé et TP de **Medoune MASSALY** et **Alioune DIOUF** — présentation prévue le **9 décembre**.

Service web **gRPC** de gestion des personnes : un contrat Protocol Buffers, un serveur Spring Boot,
un client **Angular** (gRPC-Web) et un énoncé de TP pour les autres groupes.

```
                         personne.proto  (IDL partagé)
                     ┌────────┴─────────┐
                 protoc (Maven)      buf (npm)
                     ▼                  ▼
  Postman / grpcurl ──gRPC (HTTP/2)──▶ ┌──────────────────────────────┐
                                       │ Armeria :9090                 │
  Navigateur Angular ──gRPC-Web───────▶│  PersonneGrpcService          │──▶ PersonneService ─▶ JPA ─▶ H2
  (Connect-ES, :4200)  (HTTP/1.1, CORS)│  + réflexion + /docs          │
                                       └──────────────────────────────┘
```

| Dossier                    | Contenu                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------ |
| [`proto/`](proto/)         | `personne.proto` — le contrat : 8 méthodes (5 unaires + 3 en streaming), 12 messages |
| [`backend/`](backend/)     | Spring Boot 4.1, Java 21, Armeria 1.43 (gRPC + gRPC-Web), JPA, H2 — 7 tests d’intégration |
| [`frontend/`](frontend/)   | Angular 21, Connect-ES 2, signaux — voir son [README](frontend/README.md)            |
| [`docs/TP_gRPC.md`](docs/TP_gRPC.md) | **Énoncé du TP** pour les autres groupes (requêtes Postman, erreurs, streaming)   |

## Lancer

```bash
# 1. Serveur gRPC — localhost:9090
cd backend
./mvnw spring-boot:run            # Windows : mvnw.cmd spring-boot:run

# 2. Client Angular — http://localhost:4200
cd frontend
npm install
npm start
```

Prérequis : JDK 21+, Node.js 20.19+ (Angular 21).

## Le contrat

| Type d’appel             | Méthode                                                     | Navigateur | Postman |
| ------------------------ | ----------------------------------------------------------- | :--------: | :-----: |
| Unaire                   | `Ajouter`, `Lister`, `Rechercher`, `Modifier`, `Supprimer`  | ✅         | ✅      |
| Streaming serveur        | `Suivre(SuivreRequest) returns (stream EvenementPersonne)`  | ✅         | ✅      |
| Streaming client         | `Importer(stream AjouterRequest) returns (ImportResume)`    | ❌         | ✅      |
| Bidirectionnel           | `RechercherEnFlux(stream …) returns (stream …)`             | ❌         | ✅      |

Les erreurs sont des **statuts gRPC** : `INVALID_ARGUMENT` (champ manquant, date mal formée, id ≤ 0),
`NOT_FOUND` (id inconnu), `UNIMPLEMENTED` (méthode inconnue)…

## Choix techniques (à expliquer pendant l’exposé)

- **Pourquoi Armeria ?** Un navigateur ne peut pas faire du gRPC « natif » : il n’a accès ni aux
  trames HTTP/2 ni aux *trailers*. La solution standard est **gRPC-Web**, normalement traduit par
  un proxy (Envoy). Armeria sert gRPC **et** gRPC-Web sur le même port : pas de Docker ni d’Envoy,
  et les autres groupes peuvent brancher directement leur frontend.
- **Le code du service reste du gRPC Java standard** : `PersonneServiceGrpc.PersonneServiceImplBase`
  (généré par `protoc`) et des `StreamObserver`, comme dans les exemples officiels de grpc.io.
- **Un seul contrat** : `proto/personne.proto` génère les classes Java (plugin Maven) et TypeScript
  (`npm run generate`). Changer le contrat met à jour les deux côtés.
- **Réflexion serveur** activée : Postman et grpcurl découvrent les méthodes sans le fichier `.proto`.

## Correspondance avec le plan de l’exposé

| Point du plan                           | Où le montrer                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| Introduction                            | RPC de Google, HTTP/2, open source (CNCF)                                      |
| Fonctionnement (format, requêtes/réponses) | Client Angular → **Laboratoire** : octets Protobuf, trame gRPC-Web, JSON vs Protobuf |
| IDL                                     | [`proto/personne.proto`](proto/personne.proto) et le code généré               |
| Avantages / inconvénients               | Taille des messages, streaming (panneau `Suivre()`), navigateur → gRPC-Web     |
| Sécurité                                | TLS / mTLS, jetons dans les *metadata*, intercepteurs, `CORS` (cf. `GrpcServerConfig`) |
| Tableau comparatif                      | [README racine](../README.md#comparatif)                                       |
| TP                                      | [`docs/TP_gRPC.md`](docs/TP_gRPC.md), Postman, client Angular                  |
