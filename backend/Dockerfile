FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm cache verify
RUN npm install
RUN npx prisma generate

COPY . .

RUN npm run build
RUN ls -la dist

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
