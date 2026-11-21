package sn.uasz.grpc.Config;

import com.linecorp.armeria.common.HttpMethod;
import com.linecorp.armeria.common.grpc.GrpcSerializationFormats;
import com.linecorp.armeria.server.Server;
import com.linecorp.armeria.server.cors.CorsService;
import com.linecorp.armeria.server.docs.DocService;
import com.linecorp.armeria.server.grpc.GrpcService;
import io.grpc.protobuf.services.ProtoReflectionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import sn.uasz.grpc.Grpc.PersonneGrpcService;

import java.time.Duration;

/**
 * Démarre le serveur gRPC (Armeria) sur le port 9090.
 *
 * Un seul port, trois façons de parler au même service :
 *  - gRPC natif sur HTTP/2       → Postman, grpcurl, clients Java/Python/Go…
 *  - gRPC-Web sur HTTP/1.1 ou 2  → navigateurs (frontend Angular), sans proxy Envoy
 *  - JSON « non encadré »        → page de test intégrée http://localhost:9090/docs
 */
@Configuration
public class GrpcServerConfig {

    private static final Logger log = LoggerFactory.getLogger(GrpcServerConfig.class);

    @Bean
    public Server serveurGrpc(PersonneGrpcService personneService,
                              @Value("${grpc.server.port:9090}") int port) {

        GrpcService grpc = GrpcService.builder()
                .addService(personneService)
                // Réflexion (v1alpha, la plus compatible) : Postman et grpcurl découvrent
                // les méthodes sans avoir besoin du fichier .proto
                .addService(ProtoReflectionService.newInstance())
                // gRPC (protobuf, json) + gRPC-Web (binaire et texte) pour les navigateurs
                .supportedSerializationFormats(GrpcSerializationFormats.values())
                .enableUnframedRequests(true)
                // JPA est bloquant : on n'exécute pas les méthodes sur les threads réseau
                .useBlockingTaskExecutor(true)
                .build();

        // CORS : autorise les frontends des autres groupes (localhost:4200, 5173…)
        var cors = CorsService.builderForAnyOrigin()
                .allowRequestMethods(HttpMethod.POST, HttpMethod.OPTIONS)
                .allowRequestHeaders("content-type", "x-grpc-web", "x-user-agent", "grpc-timeout",
                        "grpc-accept-encoding", "connect-protocol-version", "connect-timeout-ms", "authorization")
                .exposeHeaders("grpc-status", "grpc-message", "grpc-status-details-bin")
                .maxAge(3600)
                .newDecorator();

        Server server = Server.builder()
                .http(port)
                // pas de délai maximal : le flux Suivre() peut rester ouvert longtemps
                .requestTimeout(Duration.ZERO)
                .service(grpc)
                .serviceUnder("/docs", DocService.builder().build())
                .decorator(cors)
                .build();

        server.start().join();
        log.info("Serveur gRPC démarré : grpc://localhost:{}  (gRPC, gRPC-Web, réflexion)  — test : http://localhost:{}/docs",
                server.activeLocalPort(), server.activeLocalPort());
        return server;
    }
}
