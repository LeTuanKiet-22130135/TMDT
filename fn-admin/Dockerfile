FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

ARG VITE_API_URL=https://devb1.orifen.duckdns.org
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_CACAO_URL=https://devcacao.orifen.duckdns.org
ENV VITE_CACAO_URL=$VITE_CACAO_URL

RUN npm run build

FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
