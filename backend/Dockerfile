FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# --omit=dev: production deps only (devDeps like jest are not needed at runtime).
# (--only=production is deprecated in npm 10+.)
RUN npm ci --omit=dev

COPY src/ ./src/

EXPOSE 3001

CMD ["node", "src/index.js"]
