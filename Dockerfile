# Dockerfile
# Etapa de construcción
FROM node:22-alpine AS builder
WORKDIR /usr/src/app

# Copia los archivos de definición de dependencias
COPY package*.json ./

# Instala las dependencias del proyecto
# Usar 'npm ci' para instalaciones limpias y reproducibles basadas en package-lock.json
RUN npm ci

# Copia el resto del código fuente de la aplicación
COPY . .

# Construye la aplicación para producción
RUN npm run build

# Etapa de producción
FROM node:22-alpine AS production
WORKDIR /usr/src/app

# Copia package.json y package-lock.json (o yarn.lock) para instalar solo las dependencias de producción
COPY package*.json ./

# Instala solo las dependencias de producción
RUN npm ci --only=production

# Copia la aplicación construida desde la etapa de construcción
COPY --from=builder /usr/src/app/dist ./dist

# Expone el puerto en el que se ejecuta la aplicación
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["node", "dist/main"]
