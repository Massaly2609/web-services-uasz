# Web Services — Master 1 · UASZ

Travaux pratiques et exposés du cours **Web Services** (Master 1, Université Assane Seck de Ziguinchor).

Chaque exposé suit la même consigne : exposer une ressource **`Personne`** (ajouter, lister, rechercher,
modifier, supprimer) avec la technologie étudiée, la **tester avec Postman**, puis écrire un **client
dans une technologie différente du serveur**. Ici, chaque client utilise en plus un framework différent,
pour comparer les approches.

| #   | Technologie                  | Backend                                          | Client                  | Postman | Statut                 |
| --- | ---------------------------- | ------------------------------------------------ | ----------------------- | ------- | ---------------------- |
| 01  | [XML-RPC](01-xml-rpc/)       | Spring Boot 4 + Apache XML-RPC 3.1.3 (port 8081) | React 19 + TypeScript   | ✅      | ✅ Terminé             |
| 02  | [JSON-RPC 2.0](02-json-rpc/) | Spring Boot 4, contrôleur `/jsonrpc` (port 8082) | Vue 3 + TypeScript      | ✅      | ✅ Terminé             |
| 03  | [gRPC](03-grpc/)             | _en préparation_                                 | _Angular (prévu)_       | —       | 🚧 Exposé le 9 décembre |

Les autres exposés du calendrier (SOAP, REST, GraphQL, WebSocket, WebHook, Apache Kafka, RabbitMQ)
seront ajoutés au fil des présentations des groupes, avec la même structure.

## Structure

```
web-services-uasz/
├── 01-xml-rpc/
│   ├── backend/     # Spring Boot (Maven) — serveur XML-RPC
│   ├── frontend/    # client React + TypeScript (Vite)
│   ├── postman/     # collection Postman avec tests automatiques
│   └── README.md
├── 02-json-rpc/
│   ├── backend/     # Spring Boot (Maven) — serveur JSON-RPC 2.0
│   ├── frontend/    # client Vue 3 + TypeScript (Vite)
│   ├── postman/
│   └── README.md
├── 03-grpc/         # exposé du binôme (en cours)
├── docs/            # consignes des exposés
└── .github/workflows/ci.yml   # build des backends et des frontends à chaque push
```

## Prérequis

- **JDK 21** ou plus récent (le wrapper Maven `mvnw` est fourni)
- **Node.js 20.19+** ou 22+ et npm
- [Postman](https://www.postman.com/downloads/) pour rejouer les collections

## Démarrage rapide

Chaque exposé se lance en deux terminaux : le backend, puis le frontend.

```bash
# Terminal 1 — backend (exemple : XML-RPC)
cd 01-xml-rpc/backend
./mvnw spring-boot:run            # Windows : mvnw.cmd spring-boot:run

# Terminal 2 — frontend
cd 01-xml-rpc/frontend
npm install
npm run dev
```

| Service                      | Adresse                                  |
| ---------------------------- | ---------------------------------------- |
| Serveur XML-RPC              | `http://localhost:8081` (POST `text/xml`) |
| Serveur JSON-RPC             | `http://localhost:8082/jsonrpc`          |
| Client XML-RPC (React)       | `http://localhost:5173`                  |
| Client JSON-RPC (Vue)        | `http://localhost:5174`                  |
| Consoles H2                  | `http://localhost:8080/h2` (XML-RPC), `http://localhost:8082/h2` (JSON-RPC) |

Les bases H2 sont **en mémoire** : elles repartent à zéro à chaque redémarrage d’un backend.

## La ressource `Personne`

| Champ           | Type        | Exemple       |
| --------------- | ----------- | ------------- |
| `id`            | `Long`      | `1`           |
| `nom`           | `String`    | `DIOP`        |
| `prenom`        | `String`    | `Amadou`      |
| `dateNaissance` | `LocalDate` | `2000-05-15`  |
| `adresse`       | `String`    | `Ziguinchor`  |
| `telephone`     | `String`    | `771234567`   |

## XML-RPC et JSON-RPC en un coup d’œil

|                    | XML-RPC                                   | JSON-RPC 2.0                                         |
| ------------------ | ----------------------------------------- | ---------------------------------------------------- |
| Format             | XML (`<methodCall>`)                      | JSON (`{ jsonrpc, method, params, id }`)             |
| Paramètres         | positionnels                              | nommés (objet) ou positionnels (tableau)             |
| Erreurs            | `<fault>` avec `faultCode` / `faultString` | `error` avec codes normalisés (-32700 … -32603)      |
| Corrélation        | aucune (une requête = une réponse HTTP)   | champ `id` renvoyé par le serveur                    |
| Taille des messages | verbeuse                                 | compacte                                             |
| IDL                | aucun                                     | aucun imposé (OpenRPC / JSON Schema possibles)       |

Les deux clients web affichent les messages réellement échangés (console XML, playground et inspecteur JSON) :
c’est le support de démonstration des exposés.

## Auteurs

- **Medoune MASSALY** — [@Massaly2609](https://github.com/Massaly2609)
- **Alioune DIOUF**

Master 1 · Web Services · Université Assane Seck de Ziguinchor
