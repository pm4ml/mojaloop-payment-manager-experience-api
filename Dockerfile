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

RUN apk add --no-cache git build-base build-dependencies make gcc g++ python3 libtool openssl-dev autoconf automake bash

WORKDIR /opt/mojaloop-payment-manager-experience-api

COPY package.json package-lock.json* /opt/mojaloop-payment-manager-experience-api/
COPY src /opt/mojaloop-payment-manager-experience-api/src

RUN npm ci --production

FROM node:${NODE_VERSION}

WORKDIR /opt/mojaloop-payment-manager-experience-api

COPY --from=builder /opt/mojaloop-payment-manager-experience-api .

EXPOSE 3000

CMD ["node", "src/index.js"]
