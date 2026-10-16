# Dompet Tenang Web — static build served by nginx
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=/api/v1
ARG VITE_SITE_URL=https://dompet-tenang.web.id
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SITE_URL=$VITE_SITE_URL

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
