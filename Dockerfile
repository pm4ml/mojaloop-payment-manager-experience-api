FROM node:lts-alpine as builder

RUN apk add --no-cache git build-base build-dependencies make gcc g++ python3 libtool openssl-dev autoconf automake bash

WORKDIR /opt/mojaloop-payment-manager-experience-api

COPY package.json package-lock.json* /opt/mojaloop-payment-manager-experience-api/
COPY src /opt/mojaloop-payment-manager-experience-api/src

RUN npm ci --production

FROM node:lts-alpine

WORKDIR /opt/mojaloop-payment-manager-experience-api

COPY --from=builder /opt/mojaloop-payment-manager-experience-api .

EXPOSE 3000

CMD ["node", "src/index.js"]
