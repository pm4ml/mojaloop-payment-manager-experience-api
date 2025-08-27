# Arguments
ARG NODE_VERSION=lts-alpine

# NOTE: Ensure you set NODE_VERSION Build Argument as follows...
#
#  export NODE_VERSION="$(cat .nvmrc)-alpine"
#  docker build \
#    --build-arg NODE_VERSION=$NODE_VERSION \
#    -t mojaloop/repo-name:local \
#    .
#

# Build Image
FROM node:${NODE_VERSION} AS builder
USER root

WORKDIR /opt/app

RUN apk add --no-cache git build-base make gcc g++ python3 libtool openssl-dev autoconf automake bash \
    && cd $(npm root -g)/npm

COPY package.json package-lock.json* /opt/app/
COPY src /opt/app/src

RUN npm ci --production

FROM node:${NODE_VERSION}

WORKDIR /opt/app

# Create a non-root user: ml-user
RUN adduser -D app-user
USER app-user

COPY --chown=app-user --from=builder /opt/app .

EXPOSE 3000

CMD ["node", "src/index.js"]
