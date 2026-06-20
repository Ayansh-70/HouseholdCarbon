# Stage 1: Build the Vite frontend
FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./

# Copy package.json files for workspaces
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install --prefix frontend

# Copy frontend source and build
COPY frontend/ ./frontend/
RUN npm run build --prefix frontend

# Stage 2: Serve via Express backend
FROM node:20-slim

WORKDIR /app

# Grant node user ownership of the app directory
RUN chown -R node:node /app

# Switch to non-root user
USER node
ENV NODE_ENV=production

# Copy backend package and install only production dependencies
COPY --chown=node:node backend/package*.json ./backend/
RUN npm install --prefix backend --production

# Copy backend source
COPY --chown=node:node backend/ ./backend/

# Copy built frontend from Stage 1 into the location expected by Express (public/dist)
COPY --from=builder --chown=node:node /app/frontend/dist ./backend/public/dist

# Start the Express server
WORKDIR /app/backend
CMD ["node", "server.js"]
