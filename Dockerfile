# Etapa de build
FROM node:20-alpine as build

WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm ci

# Copia el resto del código
COPY . .

# Build de la aplicación
RUN npm run build

# Etapa de producción con nginx
FROM nginx:alpine

# Copia los archivos compilados desde la etapa de build
COPY --from=build /app/dist /usr/share/nginx/html

# Copia configuración de nginx personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
