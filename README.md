# IKA Tracker

Système de gestion de transport et logistique utilisant une architecture microservices.

## 🚀 Démarrage rapide

### Prérequis

- Docker & Docker Compose
- Node.js v20+
- Git

### Installation locale

\`\`\`bash
git clone https://github.com/ton-username/ika-tracker.git
cd ika-tracker
docker-compose up --build
\`\`\`

L'app sera disponible sur `http://localhost:8080`

## 📁 Architecture

- **Backend** : Microservices Node.js (Auth, Courier, Decharge, Payement)
- **Frontend Web** : React (branche `develop-web`)
- **Frontend Mobile** : React Native (branche `develop-mobile`)
- **Infrastructure** : Docker Compose + NGINX + MongoDB

## 📖 Documentation

- [Guide d'architecture](docs/ARCHITECTURE.md)
- [API endpoints](docs/API.md)
- [Déploiement](docs/DEPLOYMENT.md)
- [Contribuer](docs/CONTRIBUTING.md)

## 🔄 CI/CD

Pipeline automatisée sur chaque push. Voir [GitLab CI/CD](.gitlab-ci.yml)

## 📝 Branches

- `main` : Production
- `develop` : Branche de dev (backend stable)
- `develop-web` : Frontend web
- `develop-mobile` : Frontend mobile

## License

MIT
