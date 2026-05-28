FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Accept build-time argument for network configuration
ARG PUBLIC_BTC_NETWORK=mainnet
ARG MARKETPLACE_URI

# Set as environment variable for build
ENV PUBLIC_BTC_NETWORK=$PUBLIC_BTC_NETWORK
ENV MARKETPLACE_URI=$MARKETPLACE_URI

RUN npm run build

FROM node:20-alpine
WORKDIR /app
# Copy built assets from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
# Install production dependencies only
RUN npm ci --production
# Expose the port your app runs on
EXPOSE 3000

# Use an entrypoint script to handle environment variables
CMD ["node", "build"]
