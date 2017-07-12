FROM node:alpine

ADD . .
RUN npm install

LABEL databox.type="driver"

EXPOSE 8080

CMD ["npm","start"]
