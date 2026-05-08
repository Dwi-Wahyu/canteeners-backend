# Stage 1: Build
FROM node:22-alpine AS builder

# Install build dependencies if needed (e.g., for native modules)
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm install

# Copy Prisma schema files
COPY prisma ./prisma

ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ARG FIREBASE_PRIVATE_KEY="dummy"
ARG FIREBASE_CLIENT_EMAIL="dummy@dummy.com"
ARG FIREBASE_PROJECT_ID="dummy"

ENV DATABASE_URL=$DATABASE_URL
ENV FIREBASE_PRIVATE_KEY=$FIREBASE_PRIVATE_KEY
ENV FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL
ENV FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

COPY prisma.config.ts ./

# Generate Prisma Client
# The output is configured in schema.prisma to go to src/generated/prisma
RUN npx prisma generate

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

# Install runtime dependencies
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy necessary files from the builder stage
# We copy node_modules because it contains the generated Prisma client
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Environment variables as requested
# WARNING: 'localhost' in DATABASE_URL will refer to the container itself.
# If your DB is on the host, use 'host.docker.internal' (Mac/Windows) 
# or the host's IP address (Linux).
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/canteeners?schema=public"
ENV PORT=3001
ENV HOST=0.0.0.0

# Expose the application port
EXPOSE 3001

# Start the application using the production script
CMD ["npm", "run", "start:prod"]
