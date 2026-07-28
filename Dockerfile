# --- Fase 1: imagen de desarrollo de ANA-Backend ---
# (En la Fase 8 añadiremos etapas de build multi-stage para producción)

FROM node:22-slim

WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@10.30.0 --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]
