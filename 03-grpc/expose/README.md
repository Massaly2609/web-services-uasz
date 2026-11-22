# Présentation de l'exposé gRPC

Diaporama **LaTeX Beamer** (16:9) de l'exposé gRPC — Medoune MASSALY & Alioune DIOUF, 9 décembre.

| Fichier | Usage |
| --- | --- |
| [`expose-grpc.pdf`](expose-grpc.pdf) | **À projeter** : 39 diapos, dont 9 animées étape par étape (108 pages au total) |
| [`expose-grpc-handout.pdf`](expose-grpc-handout.pdf) | Version polycopié : une page par diapo, état final des animations (à imprimer ou à envoyer) |
| `expose-grpc.tex` | Source des diapos |
| `beamerthemegrpc.sty` | Thème (couleurs du client Angular, police IBM Plex, schémas TikZ) |
| `figures/` | Captures réelles du client Angular |

## Projeter

Ouvrir `expose-grpc.pdf` en **plein écran** (Adobe Reader, SumatraPDF, Edge, Chrome…) et avancer avec
→ ou la barre d'espace : chaque appui fait progresser l'animation en cours (paquet qui se déplace,
étape suivante, légende qui change).

Diapos animées : rappel RPC, architecture, **le voyage d'un appel** (9 étapes), Protobuf octet par
octet, réponse et erreur, **HTTP/2 et multiplexage**, **les 4 types d'appels**, **le streaming
`Suivre()`**, **gRPC-Web**, **les couches de sécurité**, génération de code, déroulé de la démo.

## Compiler

```bash
latexmk -pdf expose-grpc.tex            # ou : pdflatex expose-grpc.tex (deux fois)
latexmk -pdf expose-grpc-handout.tex    # version polycopié
```

Paquets utilisés (tous présents dans MiKTeX / TeX Live) : beamer, tikz, pgfplots, tcolorbox,
listings, plex-sans, plex-mono, fontawesome5, qrcode, babel-french.

## Plan (conforme à `Exposé/Plan`)

| # | Partie | Diapos | Durée indicative |
| --- | --- | --- | --- |
| 1 | Introduction du web service | RPC, gRPC en une phrase, historique, utilisateurs | 4 min |
| 2 | Fonctionnement (format, requêtes / réponses) | architecture, voyage d'un appel, Protobuf, requête, réponse, HTTP/2, 4 types d'appels, streaming, erreurs | 9 min |
| 3 | Langage de définition (IDL) | `.proto`, types, génération de code, évolution, comparaison des IDL | 4 min |
| 4 | Avantages et inconvénients | avantages, inconvénients, gRPC-Web, quand choisir gRPC | 4 min |
| 5 | Sécurité | couches de sécurité, métadonnées et intercepteur, bonnes pratiques | 3 min |
| 6 | Tableau comparatif | 6 web services, mesure réelle XML-RPC / JSON-RPC / gRPC | 3 min |
| 7 | TP et démonstration | architecture, code serveur et client, Postman, captures, démo, consignes du TP | 10 min |
| 8 | Conclusion | à retenir, questions, références | 2 min |

Suggestion de répartition (à ajuster entre vous) : une personne présente les parties 1 à 3, l'autre
les parties 4 à 6, et la démonstration (partie 7) se fait à deux — l'un manipule Postman, l'autre
le navigateur, pour montrer le flux `Suivre()` en direct.

## Chiffres cités

Toutes les tailles viennent de mesures réelles sur nos serveurs (`rechercher(1)`, corps HTTP) :
XML-RPC 149 / 561 octets, JSON-RPC 73 / 149, gRPC 7 / 56 ; la personne *DIOP Amadou* fait
51 octets en Protobuf contre 117 en JSON.
