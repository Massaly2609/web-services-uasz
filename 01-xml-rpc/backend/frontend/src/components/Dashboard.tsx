function Dashboard({ persons, loading, onNavigate, serverConnected }) {
  // Obtenir l'heure actuelle
  const now = new Date();
  const timeString = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Obtenir les 5 dernières personnes
  const recentPersons = persons.slice(-5).reverse();

  return (
    <section className="page active">
      <header className="page-header">
        <h1>Tableau de bord</h1>
        <p className="page-desc">Vue d'ensemble du service XML-RPC de gestion des personnes</p>
      </header>

      {/* Cartes de statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-info">
            <span className="stat-number">{persons.length}</span>
            <span className="stat-label">Personnes enregistrées</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🕓</div>
          <div className="stat-info">
            <span className="stat-number">{timeString}</span>
            <span className="stat-label">Dernière mise à jour</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚙</div>
          <div className="stat-info">
            <span className="stat-number">5</span>
            <span className="stat-label">Méthodes disponibles</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚀</div>
          <div className="stat-info">
            <span className="stat-number">8081</span>
            <span className="stat-label">Port du serveur</span>
          </div>
        </div>
      </div>

      {/* Section informative */}
      <div className="info-section">
        <h2>Comment ça marche ?</h2>
        <div className="info-cards">
          <div className="info-card">
            <h3>📦 1. Le protocole XML-RPC</h3>
            <p>XML-RPC est un protocole d'appel de procédure distante qui utilise XML pour coder les appels et HTTP comme mécanisme de transport. Chaque requête est un document XML envoyé au serveur.</p>
          </div>
          <div className="info-card">
            <h3>🧪 2. Les méthodes exposées</h3>
            <p>Notre backend expose 5 méthodes : <code>ajouter</code>, <code>rechercher</code>, <code>lister</code>, <code>modifier</code> et <code>supprimer</code> pour gérer les personnes.</p>
          </div>
          <div className="info-card">
            <h3>🗄 3. La base de données</h3>
            <p>Les données sont stockées dans une base H2 en mémoire. Chaque personne possède un id, un nom, un prénom, une date de naissance, une adresse et un téléphone.</p>
          </div>
        </div>
      </div>

      {/* Dernières personnes ajoutées */}
      <div className="recent-section">
        <h2>Dernières personnes ajoutées</h2>
        <div className="recent-list">
          {loading ? (
            <p className="empty-state">Chargement...</p>
          ) : !serverConnected ? (
            <p className="empty-state">Serveur déconnecté. Démarrez le backend pour voir les données.</p>
          ) : recentPersons.length === 0 ? (
            <p className="empty-state">Aucune personne enregistrée. <button className="link-btn" onClick={() => onNavigate('add')}>Ajouter la première</button></p>
          ) : (
            recentPersons.map(person => (
              <div key={person.id} className="recent-item">
                <div className="recent-avatar">
                  {(person.nom || '').charAt(0).toUpperCase()}
                </div>
                <div className="recent-info">
                  <span className="recent-name">{person.nom} {person.prenom}</span>
                  <span className="recent-date">Né(e) le {person.dateNaissance}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
