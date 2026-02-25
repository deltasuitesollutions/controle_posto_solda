FROM node:20-alpine

WORKDIR /app

COPY Web/package*.json ./
RUN npm install

COPY Web/. .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
