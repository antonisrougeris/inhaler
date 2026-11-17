FROM node:24-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci
FROM deps AS build
COPY . .
RUN npm run build
FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN groupadd --system --gid 1001 formair && useradd --system --uid 1001 --gid formair formair
COPY --from=build --chown=formair:formair /app/.next/standalone ./
COPY --from=build --chown=formair:formair /app/.next/static ./.next/static
COPY --from=build --chown=formair:formair /app/public ./public
USER formair
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","server.js"]
FROM build AS tools
CMD ["npm","run","db:migrate"]
