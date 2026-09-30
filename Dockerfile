FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build || true
EXPOSE 3000
ENV PORT=3000
          CMD ["sh", "-c", "npm start"]