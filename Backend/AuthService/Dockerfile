FROM node:20-alpine   
WORKDIR /app

COPY shared-middlewares ./shared-middlewares
RUN cd shared-middlewares && npm install --production

COPY AuthService/package*.json ./
RUN npm install --production

COPY AuthService/ ./

RUN rm -rf /app/node_modules/shared-middlewares && ln -s /app/shared-middlewares /app/node_modules/shared-middlewares

EXPOSE 8000  
CMD ["node", "app.js"]