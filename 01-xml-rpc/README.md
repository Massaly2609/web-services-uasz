# 01 · XML-RPC

Service web **XML-RPC** de gestion des personnes, avec un client **React** et une collection **Postman**.

```
Navigateur (React, :5173) ──POST /RPC2──▶ proxy Vite ──▶ Apache XML-RPC WebServer (:8081)
                                                            │
                                         PersonneXmlRpcHandler ─▶ PersonneService ─▶ JPA ─▶ H2
```

| Dossier                  | Contenu                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| [`backend/`](backend/)   | Spring Boot 4.1, Java 21, Apache XML-RPC 3.1.3, Spring Data JPA, H2     |
| [`frontend/`](frontend/) | React 19, TypeScript, Vite — voir son [README](frontend/README.md)      |
| [`postman/`](postman/)   | Collection : scénario CRUD + 3 cas de `fault`, avec tests automatiques  |

## Lancer

```bash
cd backend && ./mvnw spring-boot:run      # XML-RPC sur :8081 (Spring sur :8080)
cd frontend && npm install && npm run dev  # http://localhost:5173
```

## Méthodes exposées

Le handler est enregistré sous le nom `Personne` ; les paramètres sont **positionnels**.

| Méthode               | Paramètres                                                           | Retour          |
| --------------------- | -------------------------------------------------------------------- | --------------- |
| `Personne.ajouter`    | `string nom, string prenom, string dateNaissance, string adresse, string telephone` | `i8` (id)       |
| `Personne.lister`     | —                                                                    | `array<struct>` |
| `Personne.rechercher` | `int id`                                                             | `struct` (vide si inconnu) |
| `Personne.modifier`   | `int id, string nom, string prenom, string dateNaissance, string adresse, string telephone` | `boolean` |
| `Personne.supprimer`  | `int id`                                                             | `boolean`       |

Exemple de requête :

```xml
<?xml version="1.0"?>
<methodCall>
    <methodName>Personne.rechercher</methodName>
    <params>
        <param><value><int>1</int></value></param>
    </params>
</methodCall>
```

## Tests Postman

1. Importer [`postman/XML-RPC_Gestion_Personnes.postman_collection.json`](postman/XML-RPC_Gestion_Personnes.postman_collection.json).
2. Démarrer le backend, puis lancer la collection avec le **Collection Runner**.
3. `Ajouter` mémorise l’identifiant créé dans la variable `personneId`, réutilisée par les requêtes suivantes.

Résultat attendu : 10 requêtes, 28 assertions réussies.

## Observations

- `setEnabledForExtensions(true)` fait revenir les `Long` en `<ex:i8>` : un client strict XML-RPC
  sans extensions ne saurait pas les lire.
- Les chaînes reviennent sans balise `<string>` (`<value>DIOP</value>`), ce que la spécification autorise.
- Le serveur XML-RPC (port 8081) ne gère pas CORS ; le `CorsConfig` Spring ne couvre que le port 8080.
  Le client web passe donc par le proxy de Vite.
