# Build context for this image is the WORKSPACE ROOT (see docker-compose.yml),
# not graph-service/ alone — graph-service needs to see ../monolith at
# runtime to run madge against it, so we copy both in.
FROM node:20-alpine
WORKDIR /app

COPY graph-service/package.json ./graph-service/package.json
RUN npm install --prefix graph-service --omit=dev

COPY graph-service ./graph-service
COPY monolith ./monolith

WORKDIR /app/graph-service
EXPOSE 4100
CMD ["node", "index.js"]
