package sn.uasz.JSON_RPC.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import sn.uasz.JSON_RPC.Entite.Personne;
import sn.uasz.JSON_RPC.Service.PersonneService;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.time.LocalDate;

@RequestMapping("/jsonrpc")
@RestController
public class JsonRpcController {

    private final PersonneService service;
    private final ObjectMapper mapper;

    public JsonRpcController(
            PersonneService service,
            ObjectMapper mapper) {

        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<ObjectNode> traiter(
            @RequestBody JsonNode request) {
        JsonNode id = request != null
                ? request.get("id") : null;
        // Vérification de la requête JSON-RPC
        if (request == null
                || !request.isObject()
                || !request.has("jsonrpc")
                || !"2.0".equals(
                request.path("jsonrpc").asText())
                || !request.has("method")
                || !request.path("method").isTextual()
                || !request.has("id")
                || (id != null && !id.isNull()
                && !id.isNumber()
                && !id.isTextual())) {
            return ResponseEntity.ok(
                    erreur(null, -32600,
                            "Invalid Request")
            );
        }

        String method = request.path("method").asText();
        JsonNode params = request.get("params");

        try {

            Object resultat;

            switch (method) {

                case "Personne.ajouter":
                    resultat = ajouter(params);
                    break;

                case "Personne.rechercher":
                    resultat = rechercher(params);
                    break;

                case "Personne.lister":
                    resultat = service.lister();
                    break;

                case "Personne.modifier":
                    resultat = modifier(params);
                    break;

                case "Personne.supprimer":
                    resultat = supprimer(params);
                    break;

                default:
                    return ResponseEntity.ok(
                            erreur(id, -32601,
                                    "Method not found")
                    );
            }

            ObjectNode response =
                    mapper.createObjectNode();

            response.put("jsonrpc", "2.0");
            response.set("result",
                    mapper.valueToTree(resultat));

            response.set("id", id);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {

            return ResponseEntity.ok(
                    erreur(id, -32602, e.getMessage())
            );

        } catch (Exception e) {

            return ResponseEntity.ok(
                    erreur(id, -32603,
                            "Internal error")
            );
        }
    }

    private Long ajouter(JsonNode params) {
        verifierParams(params);
        Personne personne = convertir(params);
        return service.ajouter(personne).getId();
    }

    private Personne rechercher(JsonNode params) {
        verifierParams(params);
        Long id = lireId(params);
        Personne personne = service.rechercher(id);
        if (personne == null) {
            throw new IllegalArgumentException(
                    "Personne introuvable");
        }
        return personne;
    }

    private boolean modifier(JsonNode params) {
        verifierParams(params);
        Long id = lireId(params);
        Personne donnees = convertir(params);
        Personne resultat =
                service.modifier(id, donnees);
        if (resultat == null) {
            throw new IllegalArgumentException(
                    "Personne introuvable");
        }
        return true;
    }

    private boolean supprimer(JsonNode params) {
        verifierParams(params);
        Long id = lireId(params);
        if (!service.supprimer(id)) {
            throw new IllegalArgumentException(
                    "Personne introuvable");
        }
        return true;
    }

    private Personne convertir(JsonNode params) {
        String nom = lireTexte(params, "nom");
        String prenom = lireTexte(params, "prenom");
        String date = lireTexte(params, "dateNaissance");
        String adresse = lireTexte(params, "adresse");
        String telephone = lireTexte(params, "telephone");

        Personne p = new Personne();

        p.setNom(nom);
        p.setPrenom(prenom);
        p.setDateNaissance(LocalDate.parse(date));
        p.setAdresse(adresse);
        p.setTelephone(telephone);

        return p;
    }

    private void verifierParams(JsonNode params) {
        if (params == null || !params.isObject()) {
            throw new IllegalArgumentException(
                    "Les paramètres doivent être un objet JSON");
        }
    }

    private String lireTexte(
            JsonNode params, String champ) {
        JsonNode valeur = params.get(champ);
        if (valeur == null
                || !valeur.isTextual()
                || valeur.asText().isBlank()) {
            throw new IllegalArgumentException(
                    "Paramètre invalide : " + champ);
        }
        return valeur.asText();
    }

    private Long lireId(JsonNode params) {
        JsonNode valeur = params.get("id");
        if (valeur == null
                || !valeur.canConvertToLong()
                || valeur.asLong() <= 0) {

            throw new IllegalArgumentException(
                    "Identifiant invalide");
        }
        return valeur.asLong();
    }

    private ObjectNode erreur(
            JsonNode id, int code, String message) {

        ObjectNode response =
                mapper.createObjectNode();
        response.put("jsonrpc", "2.0");
        ObjectNode error =
                mapper.createObjectNode();
        error.put("code", code);
        error.put("message", message);
        response.set("error", error);
        response.set("id", id);
        return response;
    }

}
