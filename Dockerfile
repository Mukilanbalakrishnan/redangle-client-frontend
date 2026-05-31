# ==========================================
# Stage 1: Build the React Application
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build the app
COPY . .
RUN npm run build 
# Note: If you are using Vite, change `build` to `dist` in the next stage too.

# ==========================================
# Stage 2: Run the App
# ==========================================
FROM node:22-alpine

WORKDIR /app

# Install 'serve' globally to host the static files
RUN npm install -g serve

# Copy only the compiled static files from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port 'serve' will use
EXPOSE 3000

# Run the static server
CMD ["serve", "-s", "dist", "-l", "3000"]