package sn.uasz.grpc.Grpc;

import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.StreamObserver;
import org.springframework.stereotype.Component;
import sn.uasz.grpc.Service.EvenementsPersonne;
import sn.uasz.grpc.Service.PersonneService;
import sn.uasz.grpc.proto.AjouterRequest;
import sn.uasz.grpc.proto.EvenementPersonne;
import sn.uasz.grpc.proto.ImportResume;
import sn.uasz.grpc.proto.ListerRequest;
import sn.uasz.grpc.proto.ListerResponse;
import sn.uasz.grpc.proto.ModifierRequest;
import sn.uasz.grpc.proto.Personne;
import sn.uasz.grpc.proto.PersonneServiceGrpc;
import sn.uasz.grpc.proto.RechercherRequest;
import sn.uasz.grpc.proto.ResultatRecherche;
import sn.uasz.grpc.proto.SuivreRequest;
import sn.uasz.grpc.proto.SupprimerRequest;
import sn.uasz.grpc.proto.SupprimerResponse;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.function.Supplier;

/**
 * Implémentation du service défini dans personne.proto.
 *
 * PersonneServiceGrpc.PersonneServiceImplBase est GÉNÉRÉE par protoc à partir du contrat :
 * on ne fait que redéfinir ses méthodes. Chaque méthode reçoit le message de requête et un
 * StreamObserver pour répondre : onNext(réponse) puis onCompleted(), ou onError(statut).
 */
@Component
public class PersonneGrpcService extends PersonneServiceGrpc.PersonneServiceImplBase {

    private final PersonneService service;
    private final EvenementsPersonne evenements;

    public PersonneGrpcService(PersonneService service, EvenementsPersonne evenements) {
        this.service = service;
        this.evenements = evenements;
    }

    /* =============================================================
     *  Appels unaires : le CRUD du TP
     * ============================================================= */

    @Override
    public void ajouter(AjouterRequest req, StreamObserver<Personne> reponse) {
        repondre(reponse, () -> {
            var entite = versEntite(req.getNom(), req.getPrenom(), req.getDateNaissance(),
                    req.getAdresse(), req.getTelephone());
            Personne creee = versMessage(service.ajouter(entite));
            evenements.publier(EvenementPersonne.Type.AJOUT, creee);
            return creee;
        });
    }

    @Override
    public void lister(ListerRequest req, StreamObserver<ListerResponse> reponse) {
        repondre(reponse, () -> {
            List<Personne> personnes = service.lister().stream().map(PersonneGrpcService::versMessage).toList();
            return ListerResponse.newBuilder()
                    .addAllPersonnes(personnes)
                    .setTotal(personnes.size())
                    .build();
        });
    }

    @Override
    public void rechercher(RechercherRequest req, StreamObserver<Personne> reponse) {
        repondre(reponse, () -> versMessage(trouver(identifiant(req.getId()))));
    }

    @Override
    public void modifier(ModifierRequest req, StreamObserver<Personne> reponse) {
        repondre(reponse, () -> {
            long id = identifiant(req.getId());
            var donnees = versEntite(req.getNom(), req.getPrenom(), req.getDateNaissance(),
                    req.getAdresse(), req.getTelephone());
            var modifiee = service.modifier(id, donnees);
            if (modifiee == null) {
                throw introuvable(id);
            }
            Personne message = versMessage(modifiee);
            evenements.publier(EvenementPersonne.Type.MODIFICATION, message);
            return message;
        });
    }

    @Override
    public void supprimer(SupprimerRequest req, StreamObserver<SupprimerResponse> reponse) {
        repondre(reponse, () -> {
            long id = identifiant(req.getId());
            Personne avant = versMessage(trouver(id));
            service.supprimer(id);
            evenements.publier(EvenementPersonne.Type.SUPPRESSION, avant);
            return SupprimerResponse.newBuilder().setSupprime(true).build();
        });
    }

    /* =============================================================
     *  Streaming serveur : le flux reste ouvert tant que le client écoute
     * ============================================================= */

    @Override
    public void suivre(SuivreRequest req, StreamObserver<EvenementPersonne> reponse) {
        var flux = (ServerCallStreamObserver<EvenementPersonne>) reponse;
        Runnable desabonner = evenements.abonner(evenement -> {
            synchronized (flux) {
                if (!flux.isCancelled()) {
                    flux.onNext(evenement);
                }
            }
        });
        // Le client ferme l'onglet ou annule l'appel → on le désinscrit
        flux.setOnCancelHandler(desabonner::run);
        // Premier message immédiat : confirme l'abonnement (et envoie les en-têtes HTTP)
        synchronized (flux) {
            flux.onNext(EvenementPersonne.newBuilder()
                    .setType(EvenementPersonne.Type.ABONNEMENT)
                    .setHorodatage(java.time.Instant.now().toString())
                    .build());
        }
    }

    /* =============================================================
     *  Streaming client : N requêtes, puis une seule réponse (bilan)
     * ============================================================= */

    @Override
    public StreamObserver<AjouterRequest> importer(StreamObserver<ImportResume> reponse) {
        ImportResume.Builder bilan = ImportResume.newBuilder();
        return new StreamObserver<>() {
            private int rang = 0;

            @Override
            public void onNext(AjouterRequest req) {
                rang++;
                try {
                    var entite = versEntite(req.getNom(), req.getPrenom(), req.getDateNaissance(),
                            req.getAdresse(), req.getTelephone());
                    Personne creee = versMessage(service.ajouter(entite));
                    evenements.publier(EvenementPersonne.Type.AJOUT, creee);
                    bilan.addIds(creee.getId()).setAjoutees(bilan.getAjoutees() + 1);
                } catch (StatusRuntimeException e) {
                    bilan.setRejetees(bilan.getRejetees() + 1)
                            .addErreurs("Message " + rang + " : " + e.getStatus().getDescription());
                }
            }

            @Override
            public void onError(Throwable t) {
                // le client a annulé l'envoi : rien à répondre
            }

            @Override
            public void onCompleted() {
                reponse.onNext(bilan.build());
                reponse.onCompleted();
            }
        };
    }

    /* =============================================================
     *  Streaming bidirectionnel : une réponse par identifiant reçu
     * ============================================================= */

    @Override
    public StreamObserver<RechercherRequest> rechercherEnFlux(StreamObserver<ResultatRecherche> reponse) {
        return new StreamObserver<>() {
            @Override
            public void onNext(RechercherRequest req) {
                var trouvee = req.getId() > 0 ? service.rechercher(req.getId()) : null;
                ResultatRecherche.Builder resultat = ResultatRecherche.newBuilder()
                        .setId(req.getId())
                        .setTrouve(trouvee != null);
                if (trouvee != null) {
                    resultat.setPersonne(versMessage(trouvee));
                }
                reponse.onNext(resultat.build());
            }

            @Override
            public void onError(Throwable t) {
                // annulation côté client
            }

            @Override
            public void onCompleted() {
                reponse.onCompleted();
            }
        };
    }

    /* =============================================================
     *  Outils : conversion, validation, statuts gRPC
     * ============================================================= */

    /** Exécute l'action et transforme toute exception en statut gRPC. */
    private static <T> void repondre(StreamObserver<T> reponse, Supplier<T> action) {
        try {
            reponse.onNext(action.get());
            reponse.onCompleted();
        } catch (StatusRuntimeException e) {
            reponse.onError(e);
        } catch (RuntimeException e) {
            reponse.onError(Status.INTERNAL.withDescription("Erreur interne du serveur").withCause(e).asRuntimeException());
        }
    }

    private sn.uasz.grpc.Entite.Personne trouver(long id) {
        var personne = service.rechercher(id);
        if (personne == null) {
            throw introuvable(id);
        }
        return personne;
    }

    private static StatusRuntimeException introuvable(long id) {
        return Status.NOT_FOUND.withDescription("Aucune personne avec l'id " + id).asRuntimeException();
    }

    private static long identifiant(long id) {
        if (id <= 0) {
            throw Status.INVALID_ARGUMENT.withDescription("L'id doit être un entier positif").asRuntimeException();
        }
        return id;
    }

    private static String obligatoire(String valeur, String champ) {
        if (valeur == null || valeur.isBlank()) {
            throw Status.INVALID_ARGUMENT.withDescription("Champ obligatoire manquant : " + champ).asRuntimeException();
        }
        return valeur.trim();
    }

    private static sn.uasz.grpc.Entite.Personne versEntite(String nom, String prenom, String dateNaissance,
                                                          String adresse, String telephone) {
        LocalDate date;
        try {
            date = LocalDate.parse(obligatoire(dateNaissance, "date_naissance"));
        } catch (DateTimeParseException e) {
            throw Status.INVALID_ARGUMENT
                    .withDescription("date_naissance invalide : « " + dateNaissance + " » (format attendu : yyyy-MM-dd)")
                    .asRuntimeException();
        }
        return new sn.uasz.grpc.Entite.Personne(
                obligatoire(nom, "nom"),
                obligatoire(prenom, "prenom"),
                date,
                obligatoire(adresse, "adresse"),
                obligatoire(telephone, "telephone"));
    }

    static Personne versMessage(sn.uasz.grpc.Entite.Personne p) {
        return Personne.newBuilder()
                .setId(p.getId())
                .setNom(p.getNom())
                .setPrenom(p.getPrenom())
                .setDateNaissance(p.getDateNaissance().toString())
                .setAdresse(p.getAdresse())
                .setTelephone(p.getTelephone())
                .build();
    }
}
