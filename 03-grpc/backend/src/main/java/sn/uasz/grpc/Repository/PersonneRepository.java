package sn.uasz.grpc.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sn.uasz.grpc.Entite.Personne;

@Repository
public interface PersonneRepository extends JpaRepository<Personne, Long> {
}
