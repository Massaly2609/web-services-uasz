import { useState } from 'react';
import PersonneService from '../xmlrpc-client';

function SearchPerson({ onMessage }) {
  const [searchId, setSearchId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!searchId) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const person = await PersonneService.rechercher(parseInt(searchId));
      if (person) {
        setResult(person);
      } else {
        setError('Aucune personne trouvée avec cet ID.');
      }
    } catch (err) {
      setError('Erreur lors de la recherche. Vérifiez que l\'ID est correct.');
      console.error('Erreur recherche:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page active">
      <header className="page-header">
        <h1>Rechercher une personne</h1>
        <p className="page-desc">Entrez l'ID de la personne pour afficher ses informations</p>
      </header>

      <div className="search-container">
        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-input-group">
            <label htmlFor="searchId">ID de la personne</label>
            <div className="search-input-wrapper">
              <input
                type="number"
                id="searchId"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                min="1"
                placeholder="Ex: 1"
                required
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '⏳ Recherche...' : '🔍 Rechercher'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="message-container error">
            {error}
          </div>
        )}

        {result && (
          <div className="result-card">
            <h3>Informations de la personne</h3>
            <div className="result-grid">
              <div className="result-item">
                <span className="result-label">ID</span>
                <span className="result-value">{result.id}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Nom</span>
                <span className="result-value">{result.nom}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Prénom</span>
                <span className="result-value">{result.prenom}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Date de naissance</span>
                <span className="result-value">{result.dateNaissance}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Adresse</span>
                <span className="result-value">{result.adresse || '-'}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Téléphone</span>
                <span className="result-value">{result.telephone || '-'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default SearchPerson;
