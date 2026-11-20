# 03 · gRPC — 🚧 en préparation

Exposé de **Medoune MASSALY** et **Alioune DIOUF**, prévu le **9 décembre**.

## Plan de l’exposé (consignes communes)

1. Introduction du web service
2. Fonctionnement : HTTP/2, Protocol Buffers, exemples de requêtes / réponses, les 4 types d’appels
   (unaire, streaming serveur, streaming client, bidirectionnel)
3. Langage de définition : fichiers `.proto` (IDL) et génération de code
4. Avantages et inconvénients
5. Sécurité (TLS, authentification par métadonnées, intercepteurs)
6. Tableau comparatif avec XML-RPC, JSON-RPC, SOAP, REST, GraphQL…

## Démonstration prévue

```
03-grpc/
├── proto/       # personne.proto — contrat partagé
├── backend/     # serveur gRPC (service Personne : Ajouter, Lister, Rechercher, Modifier, Supprimer)
├── frontend/    # client web Angular (gRPC-Web / Connect via un proxy)
└── postman/     # requêtes gRPC (Postman sait importer un .proto)
```
