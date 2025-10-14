#!/bin/bash

echo "📦 Deploy de Magic2k Landing iniciado..."
echo "🛠️ Ejecutando build..."
npm run build

echo "📤 Subiendo archivos a magic2k.com..."

# Variables de conexión
USER=root
HOST=149.50.136.29
PORT=5138
DEST_PATH=/var/www/html/

# Usamos -P para especificar el puerto correcto
scp -P $PORT -r dist/* $USER@$HOST:$DEST_PATH

if [ $? -eq 0 ]; then
  echo "✅ Deploy completado con éxito!"
else
  echo "❌ Error durante el deploy"
fi