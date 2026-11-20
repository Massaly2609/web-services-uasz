# Registre XML-RPC — client React

Client web **React 19 + TypeScript + Vite** pour le service **XML-RPC** du TP « Gestion des personnes »
(backend Spring Boot + Apache XML-RPC 3.1.3, base H2 en mémoire).

> Le serveur est en Java, le client en TypeScript/React : on respecte la consigne
> « créer un client avec une technologie différente du serveur ».

## Démarrage

```bash
# 1. Backend (dans 01-xml-rpc/backend) — ouvre le serveur XML-RPC sur le port 8081
./mvnw spring-boot:run          # ou lancer XmlRpcApplication depuis IntelliJ

# 2. Frontend (dans 01-xml-rpc/frontend)
npm install
npm run dev                     # http://localhost:5173
```

| Script              | Rôle                                         |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | serveur de développement + proxy `/RPC2`     |
| `npm run build`     | vérification TypeScript puis build de prod   |
| `npm run typecheck` | vérification TypeScript seule                |
| `npm run preview`   | sert le build (`dist/`) avec le même proxy   |

## Fonctionnalités

- **Tableau de bord** : nombre de personnes, âge moyen, villes, tranches d’âge, méthodes exposées.
- **Annuaire** : tableau filtrable (`/` pour chercher), tri, ajout / modification dans un tiroir latéral,
  suppression avec confirmation. Le tiroir affiche **en direct le `<methodCall>`** qui sera envoyé.
- **Recherche par ID** : fiche détaillée + requête et réponse XML de l’échange.
- **Console XML** : composer un `<methodCall>` à la main (comme dans Postman), exemples prêts à l’emploi
  (dont deux `fault`), réponse brute / requête / valeur décodée, journal de tous les appels.
- Thème clair / sombre, responsive, resynchronisation automatique au retour sur l’onglet
  (pratique après un test dans Postman).

## Comment le client parle au serveur

Aucune librairie XML-RPC : tout est dans [`src/api/xmlrpc.ts`](src/api/xmlrpc.ts) pour rendre le protocole visible.

```xml
<!-- Requête : POST /RPC2, Content-Type: text/xml -->
<methodCall>
    <methodName>Personne.rechercher</methodName>
    <params>
        <param><value><int>1</int></value></param>
    </params>
</methodCall>
```

Points importants découverts en testant le vrai serveur :

1. **Nom des méthodes** — le handler est enregistré sous `"Personne"` (`mapping.addHandler("Personne", …)`),
   il faut donc appeler `Personne.ajouter`, et non `ajouter`.
2. **Paramètres positionnels** — `ajouter(nom, prenom, dateNaissance, adresse, telephone)` attend
   5 `<param>` dans cet ordre, pas une `<struct>`.
3. **Types de retour** — avec `setEnabledForExtensions(true)`, les `Long` reviennent en `<ex:i8>` et
   les `String` sans balise (`<value>DIOP</value>`). Le décodeur utilise `DOMParser` + `localName`
   pour gérer ces deux cas.
4. **Erreurs** — une exception Java devient une `<fault>` (HTTP 200) avec `faultCode` / `faultString`.
5. **CORS** — le serveur `org.apache.xmlrpc.webserver.WebServer` (port 8081) n’envoie aucun en-tête CORS
   (le `CorsConfig` Spring ne s’applique qu’au port 8080). Le navigateur bloquerait donc l’appel :
   le **proxy Vite** ([`vite.config.ts`](vite.config.ts)) relaie `/RPC2` vers `http://localhost:8081`.
   Pour viser un autre serveur : `XMLRPC_TARGET=http://192.168.1.20:8081 npm run dev`.

## Architecture

```
src/
├── api/
│   ├── xmlrpc.ts           # encodage <methodCall>, décodage <methodResponse>/<fault>, transport
│   ├── inspector.ts        # journal des échanges (useSyncExternalStore)
│   └── personneService.ts  # les 5 méthodes typées
├── components/             # Sidebar, PersonDrawer, ConfirmDialog, Toaster, ui (Avatar, CodeBlock…)
├── pages/                  # DashboardPage, AnnuairePage, RecherchePage, ConsolePage
├── lib/                    # formatage (dates, âge, téléphone), validation, coloration XML/JSON
├── state.tsx               # contextes React : données, notifications, UI
└── styles/app.css          # design system (variables CSS, thèmes clair/sombre)
```

## Tests Postman

La collection [`../postman/XML-RPC_Gestion_Personnes.postman_collection.json`](../postman/XML-RPC_Gestion_Personnes.postman_collection.json)
contient le scénario CRUD complet (avec tests automatiques) et trois cas de `fault`.
Importer le fichier dans Postman puis lancer le *Collection Runner*.
