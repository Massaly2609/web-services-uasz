# 02 · JSON-RPC 2.0

Service web **JSON-RPC 2.0** de gestion des personnes, avec un client **Vue 3** et une collection **Postman**.

```
Navigateur (Vue, :5174) ──POST /jsonrpc──▶ proxy Vite ──▶ Spring Boot (:8082) JsonRpcController
                                                              │
                                                  PersonneService ─▶ JPA ─▶ H2
```

| Dossier                  | Contenu                                                                    |
| ------------------------ | -------------------------------------------------------------------------- |
| [`backend/`](backend/)   | Spring Boot 4.1, Java 21, Jackson 3, Spring Data JPA, H2                   |
| [`frontend/`](frontend/) | Vue 3, TypeScript, Vite — voir son [README](frontend/README.md)            |
| [`postman/`](postman/)   | Collection : scénario CRUD + un exemple par code d’erreur, tests automatiques |

## Lancer

```bash
cd backend && ./mvnw spring-boot:run      # http://localhost:8082/jsonrpc
cd frontend && npm install && npm run dev  # http://localhost:5174
```

## Méthodes exposées

Les paramètres sont **nommés** (objet JSON).

| Méthode               | `params`                                                  | `result`      |
| --------------------- | --------------------------------------------------------- | ------------- |
| `Personne.ajouter`    | `{ nom, prenom, dateNaissance, adresse, telephone }`      | id (`number`) |
| `Personne.lister`     | `{}`                                                      | `Personne[]`  |
| `Personne.rechercher` | `{ id }`                                                  | `Personne`    |
| `Personne.modifier`   | `{ id, nom, prenom, dateNaissance, adresse, telephone }`  | `true`        |
| `Personne.supprimer`  | `{ id }`                                                  | `true`        |

```json
{ "jsonrpc": "2.0", "method": "Personne.rechercher", "params": { "id": 1 }, "id": 2 }
```

## Codes d’erreur renvoyés par le contrôleur

| Code     | Signification     | Exemple de déclenchement                               |
| -------- | ----------------- | ------------------------------------------------------ |
| `-32600` | Invalid Request   | `"jsonrpc": "1.0"`, `method` ou `id` absent            |
| `-32601` | Method not found  | `Personne.inconnue`                                    |
| `-32602` | Invalid params    | champ manquant, id inconnu (« Personne introuvable »)  |
| `-32603` | Internal error    | date `15/05/2000` (format attendu : `yyyy-MM-dd`)      |
| HTTP 400 | —                 | corps qui n’est pas du JSON (la spec prévoit `-32700`) |

## Tests Postman

1. Importer [`postman/JSON-RPC_Gestion_Personnes.postman_collection.json`](postman/JSON-RPC_Gestion_Personnes.postman_collection.json).
2. Démarrer le backend, puis lancer la collection avec le **Collection Runner**.

Résultat attendu : 12 requêtes, toutes les assertions réussies.

> Le document de TP contient une coquille dans l’exemple *Modifier* (`dateNaissancee`) :
> telle quelle, la requête renvoie `-32602`. La collection contient la version corrigée et
> la version d’origine (dossier « Codes d’erreur »).
