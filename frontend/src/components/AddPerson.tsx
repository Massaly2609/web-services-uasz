import { useState } from 'react';

function AddPerson({ onAdd, onMessage }) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    dateNaissance: '',
    adresse: '',
    telephone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onAdd(formData);
      setFormData({ nom: '', prenom: '', dateNaissance: '', adresse: '', telephone: '' });
    } catch (error) {
      onMessage('error', 'Erreur lors de l\'ajout de la personne.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ nom: '', prenom: '', dateNaissance: '', adresse: '', telephone: '' });
  };

  return (
    <section className="page active">
      <header className="page-header">
        <h1>Ajouter une personne</h1>
        <p className="page-desc">Remplissez le formulaire ci-dessous pour enregistrer une nouvelle personne</p>
      </header>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="elegant-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nom">Nom <span className="required">*</span></label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                placeholder="Ex: Diallo"
              />
            </div>
            <div className="form-group">
              <label htmlFor="prenom">Prénom <span className="required">*</span></label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                required
                placeholder="Ex: Amadou"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dateNaissance">Date de naissance <span className="required">*</span></label>
              <input
                type="date"
                id="dateNaissance"
                name="dateNaissance"
                value={formData.dateNaissance}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="telephone">Téléphone</label>
              <input
                type="tel"
                id="telephone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="Ex: +221 77 123 45 67"
              />
            </div>
          </div>
          <div className="form-group full-width">
            <label htmlFor="adresse">Adresse</label>
            <input
              type="text"
              id="adresse"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              placeholder="Ex: Dakar, Sénégal"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '⏳ Ajout en cours...' : '➕ Ajouter la personne'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              Réinitialiser
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default AddPerson;
