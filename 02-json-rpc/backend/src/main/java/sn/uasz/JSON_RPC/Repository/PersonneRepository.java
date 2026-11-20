package sn.uasz.JSON_RPC.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sn.uasz.JSON_RPC.Entite.Personne;


@Repository
public interface PersonneRepository extends JpaRepository<Personne, Long> {
}
