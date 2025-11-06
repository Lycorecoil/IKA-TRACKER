FROM node:20-alpine   
WORKDIR /app

COPY shared-middlewares ./shared-middlewares
RUN cd shared-middlewares && npm install --production

COPY CourierService/package*.json ./
RUN npm install --production

COPY CourierService/ ./

RUN rm -rf /app/node_modules/shared-middlewares && ln -s /app/shared-middlewares /app/node_modules/shared-middlewares

EXPOSE 8001  
CMD ["node", "app.js"]