package sn.uasz.grpc;

import com.linecorp.armeria.client.grpc.GrpcClients;
import com.linecorp.armeria.common.grpc.GrpcSerializationFormats;
import com.linecorp.armeria.server.Server;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.reflection.v1alpha.ServerReflectionGrpc;
import io.grpc.reflection.v1alpha.ServerReflectionRequest;
import io.grpc.reflection.v1alpha.ServerReflectionResponse;
import io.grpc.reflection.v1alpha.ServiceResponse;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import sn.uasz.grpc.proto.AjouterRequest;
import sn.uasz.grpc.proto.EvenementPersonne;
import sn.uasz.grpc.proto.ImportResume;
import sn.uasz.grpc.proto.ListerRequest;
import sn.uasz.grpc.proto.ModifierRequest;
import sn.uasz.grpc.proto.Personne;
import sn.uasz.grpc.proto.PersonneServiceGrpc.PersonneServiceBlockingStub;
import sn.uasz.grpc.proto.PersonneServiceGrpc.PersonneServiceStub;
import sn.uasz.grpc.proto.RechercherRequest;
import sn.uasz.grpc.proto.ResultatRecherche;
import sn.uasz.grpc.proto.SuivreRequest;
import sn.uasz.grpc.proto.SupprimerRequest;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Tests d'intégration : un vrai serveur gRPC sur un port libre, appelé par un vrai client. */
@SpringBootTest(properties = {"grpc.server.port=0", "app.donnees-demo=false"})
class GrpcApplicationTests {

    @Autowired
    Server server;

    private String url() {
        return "http://127.0.0.1:" + server.activeLocalPort();
    }

    private PersonneServiceBlockingStub client() {
        return GrpcClients.newClient(url(), PersonneServiceBlockingStub.class);
    }

    private PersonneServiceStub clientAsync() {
        return GrpcClients.newClient(url(), PersonneServiceStub.class);
    }

    private static AjouterRequest amadou() {
        return AjouterRequest.newBuilder().setNom("DIOP").setPrenom("Amadou")
                .setDateNaissance("2000-05-15").setAdresse("Ziguinchor").setTelephone("771234567").build();
    }

    private static Status.Code code(Throwable e) {
        return ((StatusRuntimeException) e).getStatus().getCode();
    }

    @Test
    void scenarioCrudComplet() {
        var c = client();

        Personne creee = c.ajouter(amadou());
        assertThat(creee.getId()).isPositive();

        assertThat(c.rechercher(RechercherRequest.newBuilder().setId(creee.getId()).build()).getNom())
                .isEqualTo("DIOP");

        Personne modifiee = c.modifier(ModifierRequest.newBuilder().setId(creee.getId()).setNom("DIOP")
                .setPrenom("Amadou").setDateNaissance("2000-05-15").setAdresse("Dakar").setTelephone("779876543").build());
        assertThat(modifiee.getAdresse()).isEqualTo("Dakar");

        assertThat(c.lister(ListerRequest.getDefaultInstance()).getPersonnesList())
                .extracting(Personne::getId).contains(creee.getId());

        assertThat(c.supprimer(SupprimerRequest.newBuilder().setId(creee.getId()).build()).getSupprime()).isTrue();

        assertThatThrownBy(() -> c.rechercher(RechercherRequest.newBuilder().setId(creee.getId()).build()))
                .satisfies(e -> assertThat(code(e)).isEqualTo(Status.Code.NOT_FOUND));
    }

    @Test
    void erreursDeValidation() {
        var c = client();
        assertThatThrownBy(() -> c.ajouter(amadou().toBuilder().setDateNaissance("15/05/2000").build()))
                .satisfies(e -> assertThat(code(e)).isEqualTo(Status.Code.INVALID_ARGUMENT));
        assertThatThrownBy(() -> c.ajouter(amadou().toBuilder().setNom("").build()))
                .satisfies(e -> assertThat(code(e)).isEqualTo(Status.Code.INVALID_ARGUMENT));
        assertThatThrownBy(() -> c.supprimer(SupprimerRequest.newBuilder().setId(0).build()))
                .satisfies(e -> assertThat(code(e)).isEqualTo(Status.Code.INVALID_ARGUMENT));
    }

    @Test
    void suivreRecoitLesEvenementsEnDirect() throws Exception {
        List<EvenementPersonne> recus = new CopyOnWriteArrayList<>();
        CountDownLatch abonne = new CountDownLatch(1);
        CountDownLatch deuxEvenements = new CountDownLatch(2);
        clientAsync().suivre(SuivreRequest.getDefaultInstance(), new StreamObserver<>() {
            public void onNext(EvenementPersonne ev) {
                if (ev.getType() == EvenementPersonne.Type.ABONNEMENT) { abonne.countDown(); return; }
                recus.add(ev);
                deuxEvenements.countDown();
            }
            public void onError(Throwable t) { }
            public void onCompleted() { }
        });
        assertThat(abonne.await(5, TimeUnit.SECONDS)).as("message d'abonnement reçu").isTrue();

        var c = client();
        Personne p = c.ajouter(amadou());
        c.supprimer(SupprimerRequest.newBuilder().setId(p.getId()).build());

        assertThat(deuxEvenements.await(5, TimeUnit.SECONDS)).isTrue();
        assertThat(recus).extracting(EvenementPersonne::getType)
                .containsExactly(EvenementPersonne.Type.AJOUT, EvenementPersonne.Type.SUPPRESSION);
    }

    @Test
    void importerEnStreamingClient() throws Exception {
        CompletableFuture<ImportResume> bilan = new CompletableFuture<>();
        StreamObserver<AjouterRequest> envoi = clientAsync().importer(new StreamObserver<>() {
            public void onNext(ImportResume r) { bilan.complete(r); }
            public void onError(Throwable t) { bilan.completeExceptionally(t); }
            public void onCompleted() { }
        });
        envoi.onNext(amadou());
        envoi.onNext(amadou().toBuilder().setPrenom("Awa").build());
        envoi.onNext(amadou().toBuilder().setDateNaissance("pas-une-date").build());
        envoi.onCompleted();

        ImportResume r = bilan.get(5, TimeUnit.SECONDS);
        assertThat(r.getAjoutees()).isEqualTo(2);
        assertThat(r.getRejetees()).isEqualTo(1);
        assertThat(r.getErreurs(0)).contains("Message 3");
    }

    @Test
    void rechercherEnFluxBidirectionnel() throws Exception {
        long id = client().ajouter(amadou()).getId();
        List<ResultatRecherche> resultats = new CopyOnWriteArrayList<>();
        CountDownLatch fin = new CountDownLatch(1);
        StreamObserver<RechercherRequest> envoi = clientAsync().rechercherEnFlux(new StreamObserver<>() {
            public void onNext(ResultatRecherche r) { resultats.add(r); }
            public void onError(Throwable t) { fin.countDown(); }
            public void onCompleted() { fin.countDown(); }
        });
        envoi.onNext(RechercherRequest.newBuilder().setId(id).build());
        envoi.onNext(RechercherRequest.newBuilder().setId(999_999).build());
        envoi.onCompleted();

        assertThat(fin.await(5, TimeUnit.SECONDS)).isTrue();
        assertThat(resultats).extracting(ResultatRecherche::getTrouve).containsExactly(true, false);
    }

    @Test
    void grpcWebFonctionneCommeDansUnNavigateur() {
        PersonneServiceBlockingStub web = GrpcClients.builder(url())
                .serializationFormat(GrpcSerializationFormats.PROTO_WEB)
                .build(PersonneServiceBlockingStub.class);
        Personne p = web.ajouter(amadou());
        assertThat(web.rechercher(RechercherRequest.newBuilder().setId(p.getId()).build()).getPrenom())
                .isEqualTo("Amadou");
    }

    @Test
    void reflexionServeurPourPostman() throws Exception {
        CompletableFuture<ServerReflectionResponse> reponse = new CompletableFuture<>();
        var reflexion = GrpcClients.newClient(url(), ServerReflectionGrpc.ServerReflectionStub.class);
        StreamObserver<ServerReflectionRequest> envoi = reflexion.serverReflectionInfo(new StreamObserver<>() {
            public void onNext(ServerReflectionResponse r) { reponse.complete(r); }
            public void onError(Throwable t) { reponse.completeExceptionally(t); }
            public void onCompleted() { }
        });
        envoi.onNext(ServerReflectionRequest.newBuilder().setListServices("*").build());
        envoi.onCompleted();

        assertThat(reponse.get(5, TimeUnit.SECONDS).getListServicesResponse().getServiceList())
                .extracting(ServiceResponse::getName)
                .contains("uasz.personne.v1.PersonneService");
    }
}
