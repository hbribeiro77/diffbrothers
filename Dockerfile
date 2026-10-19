# syntax=docker/dockerfile:1
# EasyPanel: Dockerfile na raiz, PORT vinda do painel, health em GET /health.
# O entrypoint da imagem nginx lê /etc/nginx/templates/*.template e escuta em $PORT.

FROM node:22-alpine AS compilacao
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ENV PORT=80
COPY configuracao_nginx_servir_build_estatico_diffbrothers.conf /etc/nginx/templates/default.conf.template
COPY --from=compilacao /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD sh -c "wget -q -O /dev/null http://127.0.0.1:${PORT}/health"
