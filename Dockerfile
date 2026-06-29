FROM node:22-slim

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app
COPY . .

RUN pnpm install --no-frozen-lockfile --ignore-scripts
RUN pnpm --filter @workspace/api-server run build

WORKDIR /app/artifacts/api-server
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]