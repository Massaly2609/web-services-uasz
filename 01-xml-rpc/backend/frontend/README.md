# Frontend XML-RPC — Gestion des Personnes (React + Vite)

## 📋 Présentation

Ce projet est une interface web moderne développée avec **React** et **Vite** pour interagir avec le backend XML-RPC de gestion des personnes. Elle remplace l'usage de Postman par une application web intuitive et élégante.

## 🏗 Architecture

```
frontend/
├── src/
│   ├── components/          # Composants React
│   │   ├── Sidebar.tsx      # Barre latérale de navigation
│   │   ├── Dashboard.tsx    # Tableau de bord avec statistiques
│   │   ├── PersonList.tsx   # Liste des personnes (tableau)
│   │   ├── AddPerson.tsx    # Formulaire d'ajout
│   │   ├── SearchPerson.tsx # Recherche par ID
│   │   ├── EditModal.tsx    # Modal de modification
│   │   ├── Sidebar.css      # Styles du sidebar
│   │   └── EditModal.css    # Styles du modal
│   ├── App.tsx              # Composant principal (navigation + état global)
│   ├── App.css              # Styles globaux de l'application
│   ├── main.tsx             # Point d'entrée React
│   └── xmlrpc-client.js     # Client XML-RPC (encodeur/décodeur XML)
├── index.html               # Page HTML avec police Inter
├── package.json             # Dépendances npm
├── tsconfig.json            # Configuration TypeScript
└── vite.config.ts           # Configuration Vite
```

## 🚀 Lancement

### Prérequis
- **Node.js** v18+ installé
- **npm** installé
- **Backend Spring Boot** démarré sur le port 8081

### Étapes

1. **Installer les dépendances :**
   ```bash
   cd frontend
   npm install
   ```

2. **Démarrer le backend Spring Boot :**
   ```bash
   # Dans le dossier racine du projet
   ./mvnw spring-boot:run
   ```

3. **Démarrer le frontend en mode développement :**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Ouvrir le navigateur :**
   L'application est accessible à l'adresse `http://localhost:5173`

### Build pour la production
```bash
npm run build
npm run preview
```

## 🎯 Fonctionnalités

### 1. Tableau de bord
- Nombre de personnes enregistrées
- Dernière mise à jour
- Méthodes XML-RPC disponibles
- Port du serveur
- Explication du protocole XML-RPC
- Dernières personnes ajoutées

### 2. Liste des personnes
- Tableau complet avec toutes les colonnes (ID, Nom, Prénom, Date de naissance, Adresse, Téléphone)
- Boutons **Modifier** et **Supprimer** pour chaque personne
- Bouton **Rafraîchir** pour recharger les données

### 3. Ajouter une personne
- Formulaire avec validation HTML5
- Champs : Nom, Prénom, Date de naissance, Adresse, Téléphone
- Message de confirmation après l'ajout

### 4. Rechercher
- Recherche par ID
- Affichage des informations dans une carte élégante

### 5. Modifier
- Fenêtre modale avec formulaire pré-rempli
- Mise à jour en temps réel

## 📡 Communication XML-RPC

Le fichier `xmlrpc-client.js` implémente un client XML-RPC complet en JavaScript pur :

### Encodage XML-RPC
Chaque requête JavaScript est convertie en XML :

**Exemple : Ajouter une personne**
```javascript
// JavaScript
PersonneService.ajouter({ nom: "Diallo", prenom: "Amadou", ... })
```

**Requête XML envoyée :**
```xml
<?xml version="1.0"?>
<methodCall>
  <methodName>ajouter</methodName>
  <params>
    <value>
      <struct>
        <member><name>nom</name><value><string>Diallo</string></value></member>
        <member><name>prenom</name><value><string>Amadou</string></value></member>
        ...
      </struct>
    </value>
  </params>
</methodCall>
```

### Méthodes disponibles
| Méthode | Paramètres | Retour | Description |
|---------|-----------|--------|-------------|
| `ajouter` | Personne (struct) | ID (int) | Ajoute une nouvelle personne |
| `rechercher` | ID (int) | Personne (struct) | Recherche par ID |
| `lister` | - | Liste (array) | Récupère toutes les personnes |
| `modifier` | Personne (struct) | Booléen | Modifie une personne existante |
| `supprimer` | ID (int) | Booléen | Supprime une personne |

## 🎨 Design

- **Police** : Inter (Google Fonts)
- **Palette** : Violet/Indigo (#6366f1) comme couleur principale
- **Sidebar** : Fond sombre (#1e1b4b) avec navigation claire
- **Cartes** : Ombres subtiles avec effets hover
- **Responsive** : Adapté mobile, tablette et desktop

## 🔧 Concepts React utilisés

Ce projet démontre les concepts clés de React :

1. **Composants fonctionnels** : Tous les composants utilisent la syntaxe fonctionnelle
2. **Hooks** :
   - `useState` : Gestion de l'état local (formulaires, navigation, données)
   - `useEffect` : Effets de bord (connexion au serveur au chargement)
3. **Props** : Passage de données entre composants parents et enfants
4. **Formulaires contrôlés** : Les inputs sont liés à l'état React
5. **Rendu conditionnel** : Affichage dynamique selon l'état (loading, erreur, résultat)
6. **Listes et keys** : Rendu de listes avec `map()` et `key` unique
7. **Gestion d'événements** : `onClick`, `onChange`, `onSubmit`

## 📝 Notes

- Le backend doit être démarré avant d'ouvrir le frontend
- Le statut "Déconnecté" est normal lorsque le serveur XML-RPC n'est pas en cours d'exécution
- Les données sont stockées en mémoire (H2) dans le backend
- Le frontend utilise TypeScript pour la sécurité des types
