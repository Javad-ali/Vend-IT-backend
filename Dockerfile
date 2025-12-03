# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY tsconfig.json tsconfig.build.json ./ 
COPY src ./src
COPY supabase ./supabase
COPY scripts ./scripts
RUN npm run build

FROM base AS production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY src/views ./src/views
COPY src/public ./src/public
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/server.js"]
