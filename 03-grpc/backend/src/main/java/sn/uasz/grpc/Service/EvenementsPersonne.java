package sn.uasz.grpc.Service;

import org.springframework.stereotype.Component;
import sn.uasz.grpc.proto.EvenementPersonne;
import sn.uasz.grpc.proto.Personne;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

/**
 * Petit bus d'événements en mémoire : chaque abonné (un appel Suivre ouvert)
 * reçoit les ajouts, modifications et suppressions dès qu'ils ont lieu.
 */
@Component
public class EvenementsPersonne {

    private final List<Consumer<EvenementPersonne>> abonnes = new CopyOnWriteArrayList<>();

    /** Inscrit un abonné ; la fonction renvoyée le désinscrit. */
    public Runnable abonner(Consumer<EvenementPersonne> abonne) {
        abonnes.add(abonne);
        return () -> abonnes.remove(abonne);
    }

    public void publier(EvenementPersonne.Type type, Personne personne) {
        EvenementPersonne evenement = EvenementPersonne.newBuilder()
                .setType(type)
                .setPersonne(personne)
                .setHorodatage(Instant.now().toString())
                .build();
        for (Consumer<EvenementPersonne> abonne : abonnes) {
            try {
                abonne.accept(evenement);
            } catch (RuntimeException e) {
                abonnes.remove(abonne); // client parti : on l'oublie
            }
        }
    }

    public int nombreAbonnes() {
        return abonnes.size();
    }
}
