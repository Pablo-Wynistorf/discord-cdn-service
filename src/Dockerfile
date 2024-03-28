FROM node:latest

WORKDIR /usr/src/app

COPY package.json /usr/src/app
COPY package-lock.json /usr/src/app
COPY express.js /usr/src/app
COPY public /usr/src/app/public

RUN npm install

CMD sh -c 'node express.js'