import { useState } from 'react';
import './EditModal.css';

function EditModal({ person, onSave, onClose }) {
  const [formData, setFormData] = useState({
    id: person.id,
    nom: person.nom || '',
    prenom: person.prenom || '',
    dateNaissance: person.dateNaissance || '',
    adresse: person.adresse || '',
    telephone: person.telephone || '',
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
      await onSave(formData);
    } catch (error) {
      console.error('Erreur modification:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Fermer avec la touche Escape
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Modifier la personne</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="elegant-form">
          <input type="hidden" name="id" value={formData.id} />
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="editNom">Nom <span className="required">*</span></label>
              <input
                type="text"
                id="editNom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="editPrenom">Prénom <span className="required">*</span></label>
              <input
                type="text"
                id="editPrenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="editDateNaissance">Date de naissance <span className="required">*</span></label>
              <input
                type="date"
                id="editDateNaissance"
                name="dateNaissance"
                value={formData.dateNaissance}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="editTelephone">Téléphone</label>
              <input
                type="tel"
                id="editTelephone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="editAdresse">Adresse</label>
            <input
              type="text"
              id="editAdresse"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '⏳ Enregistrement...' : '✓ Enregistrer les modifications'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditModal;
