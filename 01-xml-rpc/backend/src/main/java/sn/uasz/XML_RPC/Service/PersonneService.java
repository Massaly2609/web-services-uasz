package sn.uasz.XML_RPC.Service;

import org.springframework.stereotype.Service;
import sn.uasz.XML_RPC.Entite.Personne;
import sn.uasz.XML_RPC.Repository.PersonneRepository;

import java.util.List;
import java.util.Optional;

@Service
public class PersonneService {

    private final PersonneRepository repository;

    public PersonneService(PersonneRepository repository) {
        this.repository = repository;
    }

    public Personne ajouter(Personne personne) {
        return repository.save(personne);
    }

    public Personne rechercher(Long id) {
        return repository.findById(id).orElse(null);
    }

    public List<Personne> lister() {
        return repository.findAll();
    }

    public Personne modifier(Long id, Personne nouvellesDonnees) {
        Personne personne = rechercher(id);
        if (personne == null) {
            return null;
        }
        personne.setNom(nouvellesDonnees.getNom());
        personne.setPrenom(nouvellesDonnees.getPrenom());
        personne.setDateNaissance(
                nouvellesDonnees.getDateNaissance()
        );
        personne.setAdresse(nouvellesDonnees.getAdresse());
        personne.setTelephone(nouvellesDonnees.getTelephone());

        return repository.save(personne);
    }

    public boolean supprimer(Long id) {
        if (!repository.existsById(id)) {
            return false;
        }
        repository.deleteById(id);
        return true;
    }

}
