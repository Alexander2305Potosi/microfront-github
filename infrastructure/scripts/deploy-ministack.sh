#!/usr/bin/env bash
set -e

ENDPOINT_URL="http://localhost:4566"
STACK_NAME="mfs-infrastructure"
ENVIRONMENT="dev"
PROJECT_PREFIX="mfs-app"
DOMAIN_NAME="mfs-app.local"

echo "🚀 [1/4] Desplegando plantilla de CloudFormation en MiniStack..."
aws --endpoint-url=${ENDPOINT_URL} cloudformation deploy \
  --stack-name ${STACK_NAME} \
  --template-file infrastructure/cloudformation/mfs-stack.yaml \
  --parameter-overrides Environment=${ENVIRONMENT} ProjectPrefix=${PROJECT_PREFIX} DomainName=${DOMAIN_NAME} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset

echo "📦 [2/4] Listando buckets S3 creados en MiniStack:"
aws --endpoint-url=${ENDPOINT_URL} s3 ls

echo "🔨 [3/4] Sincronizando Microfrontends a los Buckets de S3..."

# Definición de parejas: folder_dist:bucket_name
MFS=(
  "host:${PROJECT_PREFIX}-${ENVIRONMENT}-host"
  "mf-github-profiles:${PROJECT_PREFIX}-${ENVIRONMENT}-mf-github-profiles"
  "mf-users:${PROJECT_PREFIX}-${ENVIRONMENT}-mf-users"
  "mf-repos:${PROJECT_PREFIX}-${ENVIRONMENT}-mf-repos"
  "mf-complex:${PROJECT_PREFIX}-${ENVIRONMENT}-mf-complex"
)

for item in "${MFS[@]}"; do
  IFS=":" read -r app_name bucket_name <<< "$item"
  dist_path="dist/${app_name}/browser"

  if [ -d "$dist_path" ]; then
    echo "  -> Subiendo ${app_name} a s3://${bucket_name}..."
    
    # 1. Subir JS, CSS, imágenes con caché inmutable (1 año)
    aws --endpoint-url=${ENDPOINT_URL} s3 sync "$dist_path" "s3://${bucket_name}" \
      --exclude "*.json" --exclude "index.html" \
      --cache-control "public, max-age=31536000, immutable"

    # 2. Subir remoteEntry.json e index.html sin caché
    aws --endpoint-url=${ENDPOINT_URL} s3 sync "$dist_path" "s3://${bucket_name}" \
      --exclude "*" --include "*.json" --include "index.html" \
      --cache-control "no-cache, no-store, must-revalidate"
  else
    echo "  ⚠️  Advertencia: No se encontró la carpeta '${dist_path}'. Ejecuta 'npm run build' primero si deseas subir los archivos compilados."
  fi
done

echo "✅ [4/4] ¡Despliegue en MiniStack finalizado con éxito!"
