FROM node:18 as base

WORKDIR /home/panku/Rolebot

COPY package*.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build