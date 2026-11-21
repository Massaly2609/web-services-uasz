package sn.uasz.grpc.Config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import sn.uasz.grpc.Entite.Personne;
import sn.uasz.grpc.Service.PersonneService;

import java.time.LocalDate;

/**
 * Quelques personnes au démarrage, pour que les autres groupes aient des données
 * à afficher dans leur frontend. Désactiver avec app.donnees-demo=false.
 */
@Component
@ConditionalOnProperty(name = "app.donnees-demo", havingValue = "true", matchIfMissing = true)
public class DonneesDemo implements CommandLineRunner {

    private final PersonneService service;

    public DonneesDemo(PersonneService service) {
        this.service = service;
    }

    @Override
    public void run(String... args) {
        if (!service.lister().isEmpty()) {
            return;
        }
        service.ajouter(new Personne("DIOP", "Amadou", LocalDate.of(2000, 5, 15), "Ziguinchor", "771234567"));
        service.ajouter(new Personne("SARR", "Fatou", LocalDate.of(1998, 11, 2), "Dakar", "781234560"));
        service.ajouter(new Personne("BADJI", "Aïssatou", LocalDate.of(2003, 7, 9), "Ziguinchor", "709876512"));
    }
}
