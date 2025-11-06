FROM node:20-alpine   
WORKDIR /app

COPY shared-middlewares ./shared-middlewares
RUN cd shared-middlewares && npm install --production

COPY DechargeService/package*.json ./
RUN npm install --production

COPY DechargeService/ ./

RUN rm -rf /app/node_modules/shared-middlewares && ln -s /app/shared-middlewares /app/node_modules/shared-middlewares

EXPOSE 8002  
CMD ["node", "app.js"]