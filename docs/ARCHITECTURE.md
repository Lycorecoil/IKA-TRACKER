# Architecture IKA Tracker

## Vue d'ensemble

L'application utilise une architecture **microservices conteneurisée** avec :

- **4 microservices Node.js** : Auth, Courier, Decharge, Payement
- **MongoDB** : 1 base par service (isolation des données)
- **Redis** : Cache et session (1 par service)
- **NGINX** : Reverse proxy / Load balancer
- **Docker Compose** : Orchestration locale

## Flux de requête

Utilisateur → NGINX (8080) → Service Correspondant → MongoDB/Redis

## Services

### AuthService (8000)

Gère l'authentification, les rôles, les permissions.

### CourierService (8001)

Gère les livreurs, les trajets, les documents.

### DechargeService (8002)

Gère les opérations de décharge et les documents.

### PayementService (8003)

Gère les paiements via Stripe.

## Déploiement local

Voir `docker-compose.yml` pour la configuration complète.
