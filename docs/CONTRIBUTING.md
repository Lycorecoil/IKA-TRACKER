# Contribuer

Merci de contribuer ! Voici les étapes :

## Setup

\`\`\`bash
git clone https://github.com/ton-username/ika-tracker.git
cd ika-tracker
docker-compose up --build
\`\`\`

## Branches

- `develop` : Frontend-agnostic (backend)
- `develop-web` : Frontend React
- `develop-mobile` : Frontend React Native

## Workflow

1. Crée une branche à partir de `develop`
   \`\`\`bash
   git checkout -b feature/ma-feature
   \`\`\`

2. Commit & Push
   \`\`\`bash
   git add .
   git commit -m "feat: description courte"
   git push origin feature/ma-feature
   \`\`\`

3. Fais une **Pull Request** sur GitHub
4. Attends la revue et la CI/CD ✅

## Standards de code

- ESLint pour Node.js
- Prettier pour le formatage
- Tests obligatoires pour AuthService

## Messages de commit

\`\`\`
feat: Ajout d'une nouvelle feature
fix: Correction d'un bug
docs: Mise à jour de la doc
test: Ajout de tests
\`\`\`
