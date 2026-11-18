import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PersonList from './components/PersonList';
import AddPerson from './components/AddPerson';
import SearchPerson from './components/SearchPerson';
import EditModal from './components/EditModal';
import PersonneService from './xmlrpc-client';

function App() {
  // État pour la navigation entre les pages
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // État pour la liste des personnes
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // État pour le statut du serveur
  const [serverConnected, setServerConnected] = useState(false);
  
  // État pour le modal de modification
  const [editingPerson, setEditingPerson] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // État pour les messages
  const [message, setMessage] = useState({ type: '', text: '' });

  // Vérifier la connexion au serveur au chargement
  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    const connected = await PersonneService.ping();
    setServerConnected(connected);
    if (connected) {
      loadPersons();
    }
  };

  // Charger la liste des personnes
  const loadPersons = async () => {
    setLoading(true);
    try {
      const data = await PersonneService.lister();
      setPersons(data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      showMessage('error', 'Impossible de charger la liste des personnes.');
    } finally {
      setLoading(false);
    }
  };

  // Afficher un message temporaire
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Gérer l'ajout d'une personne
  const handleAddPerson = async (personne) => {
    try {
      await PersonneService.ajouter(personne);
      showMessage('success', 'Personne ajoutée avec succès !');
      await loadPersons();
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      showMessage('error', 'Erreur lors de l\'ajout de la personne.');
    }
  };

  // Gérer la suppression d'une personne
  const handleDeletePerson = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette personne ?')) {
      return;
    }
    try {
      await PersonneService.supprimer(id);
      showMessage('success', 'Personne supprimée avec succès !');
      await loadPersons();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showMessage('error', 'Erreur lors de la suppression de la personne.');
    }
  };

  // Ouvrir le modal de modification
  const handleEditPerson = async (id) => {
    try {
      const person = await PersonneService.rechercher(id);
      setEditingPerson(person);
      setShowEditModal(true);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      showMessage('error', 'Impossible de charger les informations de la personne.');
    }
  };

  // Gérer la modification d'une personne
  const handleUpdatePerson = async (personne) => {
    try {
      await PersonneService.modifier(personne);
      showMessage('success', 'Personne modifiée avec succès !');
      setShowEditModal(false);
      setEditingPerson(null);
      await loadPersons();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      showMessage('error', 'Erreur lors de la modification de la personne.');
    }
  };

  // Fermer le modal
  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingPerson(null);
  };

  // Rendu de la page active
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            persons={persons}
            loading={loading}
            onNavigate={setCurrentPage}
            serverConnected={serverConnected}
          />
        );
      case 'list':
        return (
          <PersonList
            persons={persons}
            loading={loading}
            onDelete={handleDeletePerson}
            onEdit={handleEditPerson}
            onRefresh={loadPersons}
          />
        );
      case 'add':
        return (
          <AddPerson
            onAdd={handleAddPerson}
            onMessage={showMessage}
          />
        );
      case 'search':
        return (
          <SearchPerson
            onMessage={showMessage}
          />
        );
      default:
        return <Dashboard persons={persons} loading={loading} onNavigate={setCurrentPage} serverConnected={serverConnected} />;
    }
  };

  return (
    <div className="app">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        serverConnected={serverConnected}
        onReconnect={checkServerStatus}
      />
      <main className="main-content">
        {message.text && (
          <div className={`message-banner ${message.type}`}>
            {message.text}
            <button className="message-close" onClick={() => setMessage({ type: '', text: '' })}>
              &times;
            </button>
          </div>
        )}
        {renderPage()}
      </main>
      {showEditModal && editingPerson && (
        <EditModal
          person={editingPerson}
          onSave={handleUpdatePerson}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default App;
