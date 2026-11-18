function PersonList({ persons, loading, onDelete, onEdit, onRefresh }) {
  return (
    <section className="page active">
      <header className="page-header">
        <h1>Liste des personnes</h1>
        <p className="page-desc">Consultez, modifiez ou supprimez les personnes enregistrées</p>
        <button className="btn btn-primary" onClick={onRefresh}>
          🔄 Rafraîchir
        </button>
      </header>

      <div className="table-container">
        {loading ? (
          <p className="empty-state">Chargement des données...</p>
        ) : persons.length === 0 ? (
          <p className="empty-state">Aucune personne enregistrée.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Date de naissance</th>
                <th>Adresse</th>
                <th>Téléphone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {persons.map(person => (
                <tr key={person.id}>
                  <td>{person.id}</td>
                  <td>{person.nom}</td>
                  <td>{person.prenom}</td>
                  <td>{person.dateNaissance}</td>
                  <td>{person.adresse || '-'}</td>
                  <td>{person.telephone || '-'}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => onEdit(person.id)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => onDelete(person.id)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default PersonList;
