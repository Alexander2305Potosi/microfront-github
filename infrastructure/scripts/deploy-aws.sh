#!/usr/bin/env bash
set -e

STACK_NAME="mfs-infrastructure"
ENVIRONMENT="${1:-prod}"
PROJECT_PREFIX="${2:-mfs-app}"
REGION="${AWS_REGION:-us-east-1}"

echo "🚀 [1/4] Desplegando plantilla de CloudFormation en AWS (${REGION})..."
aws cloudformation deploy \
  --stack-name ${STACK_NAME} \
  --template-file infrastructure/cloudformation/mfs-stack.yaml \
  --parameter-overrides Environment=${ENVIRONMENT} ProjectPrefix=${PROJECT_PREFIX} \
  --capabilities CAPABILITY_IAM \
  --region ${REGION}

echo "🔍 [2/4] Obteniendo ID de distribución de CloudFront..."
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text \
  --region ${REGION})

echo "  -> Distribution ID: ${DISTRIBUTION_ID}"

echo "🔨 [3/4] Sincronizando Microfrontends a S3..."

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
    
    # 1. Subir assets inmutables con caché de 1 año
    aws s3 sync "$dist_path" "s3://${bucket_name}" \
      --exclude "*.json" --exclude "index.html" \
      --cache-control "public, max-age=31536000, immutable" \
      --region ${REGION}

    # 2. Subir manifiestos e index sin caché
    aws s3 sync "$dist_path" "s3://${bucket_name}" \
      --exclude "*" --include "*.json" --include "index.html" \
      --cache-control "no-cache, no-store, must-revalidate" \
      --region ${REGION}
  else
    echo "  ⚠️  Advertencia: No existe '${dist_path}'. Ejecuta 'npm run build' antes de desplegar."
  fi
done

if [ "$DISTRIBUTION_ID" != "unknown" ] && [ -n "$DISTRIBUTION_ID" ]; then
  echo "⚡ [4/4] Invalidando caché en CloudFront..."
  aws cloudfront create-invalidation \
    --distribution-id ${DISTRIBUTION_ID} \
    --paths "/*" \
    --region ${REGION}
fi

echo "✅ ¡Despliegue en AWS completado exitosamente!"
