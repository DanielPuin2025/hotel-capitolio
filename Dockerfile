FROM node:22-alpine

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node backend/ ./
COPY --chown=node:node frontend/ /app/frontend/
RUN mkdir -p /app/backend/uploads && chown -R node:node /app/backend/uploads

ENV NODE_ENV=production
EXPOSE 3000

USER node
CMD ["node", "server.js"]
