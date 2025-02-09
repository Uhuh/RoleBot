FROM node:alpine as base

WORKDIR /home/panku/Rolebot

RUN apk update && apk add --no-cache bash && apk --no-cache add curl

COPY package*.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build

RUN curl -sL https://sentry.io/get-cli/ | bash  # Download and install sentry-cli

ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_AUTH_TOKEN

RUN echo "Sentry org: $SENTRY_ORG"
RUN echo "Sentry project: $SENTRY_PROJECT"

RUN sentry-cli sourcemaps inject --org $SENTRY_ORG --project $SENTRY_PROJECT ./build && \
    sentry-cli sourcemaps upload --org $SENTRY_ORG --project $SENTRY_PROJECT ./build --auth-token $SENTRY_AUTH_TOKEN