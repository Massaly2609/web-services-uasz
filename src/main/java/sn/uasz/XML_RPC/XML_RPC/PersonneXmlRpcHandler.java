package sn.uasz.XML_RPC.XML_RPC;

import org.springframework.stereotype.Component;
import sn.uasz.XML_RPC.Entite.Personne;
import sn.uasz.XML_RPC.Service.PersonneService;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class PersonneXmlRpcHandler {

    private final PersonneService service;

    public PersonneXmlRpcHandler(PersonneService service) {
        this.service = service;
    }


    public Long ajouter(
            String nom,
            String prenom,
            String dateNaissance,
            String adresse,
            String telephone) {

        Personne personne = new Personne(
                nom,
                prenom,
                LocalDate.parse(dateNaissance),
                adresse,
                telephone
        );

        return service.ajouter(personne).getId();
    }

// READ : rechercher une personne
    public Map<String, Object> rechercher(int id) {

        Personne p = service.rechercher((long) id);

        if (p == null) {
            return new HashMap<>();
        }

        return convertir(p);
    }

    // READ : lister toutes les personnes
    public List<Map<String, Object>> lister() {

        List<Map<String, Object>> resultat = new ArrayList<>();

        for (Personne p : service.lister()) {
            resultat.add(convertir(p));
        }

        return resultat;
    }

    // UPDATE
    public Boolean modifier(
            int id,
            String nom,
            String prenom,
            String dateNaissance,
            String adresse,
            String telephone) {

        Personne personne = new Personne(
                nom,
                prenom,
                LocalDate.parse(dateNaissance),
                adresse,
                telephone
        );

        return service.modifier((long) id, personne) != null;
    }

    // DELETE
    public Boolean supprimer(int id) {
        return service.supprimer((long) id);
    }

    // Conversion Personne vers une structure XML-RPC
    private Map<String, Object> convertir(Personne p) {

        Map<String, Object> map = new HashMap<>();

        map.put("id", p.getId());
        map.put("nom", p.getNom());
        map.put("prenom", p.getPrenom());

        map.put(
                "dateNaissance",
                p.getDateNaissance().toString()
        );

        map.put("adresse", p.getAdresse());
        map.put("telephone", p.getTelephone());

        return map;
    }

}
