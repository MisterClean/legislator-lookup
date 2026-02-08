FROM node:20-bookworm-slim

WORKDIR /app

# Copy frontend package files and install deps
COPY frontend/package*.json ./
RUN npm install --no-audit --no-fund

# Copy frontend source and data
COPY frontend/ ./

# Next.js inlines NEXT_PUBLIC_* at build time — Railway passes these as build args
ARG NEXT_PUBLIC_PROTOMAPS_API_KEY
ENV NEXT_PUBLIC_PROTOMAPS_API_KEY=$NEXT_PUBLIC_PROTOMAPS_API_KEY

# Build Next.js
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["npx", "next", "start", "-H", "0.0.0.0"]

