package sn.uasz.grpc.Entite;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Entité JPA (base H2). À ne pas confondre avec le message Protobuf
 * sn.uasz.grpc.proto.Personne, qui est la représentation échangée sur le réseau.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Personne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;
    private String prenom;
    private LocalDate dateNaissance;
    private String adresse;
    private String telephone;

    public Personne(String nom, String prenom, LocalDate dateNaissance, String adresse, String telephone) {
        this.nom = nom;
        this.prenom = prenom;
        this.dateNaissance = dateNaissance;
        this.adresse = adresse;
        this.telephone = telephone;
    }
}
