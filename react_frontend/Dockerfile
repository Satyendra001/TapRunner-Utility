FROM node:alpine

WORKDIR /app

COPY package.json ./

COPY package-lock.json ./

RUN npm install
RUN apk add bash


COPY . ./

# Start the app
CMD ["npm","start"]
