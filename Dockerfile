# Étape 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Installer TOUTES les dépendances (y compris devDependencies pour nest build)
RUN npm ci

# Copier le code source
COPY src ./src

# Build l'application
RUN npm run build

# Étape 2: Production
FROM node:22-alpine
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer UNIQUEMENT les dépendances de production
RUN npm ci --only=production

# Copier les fichiers buildés depuis le builder
COPY --from=builder /app/dist ./dist

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Exposer le port
EXPOSE 3000

# Démarrer l'application
CMD ["node", "dist/main.js"]
