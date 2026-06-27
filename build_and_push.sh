#!/bin/bash
set -e

REGISTRY="hub.hizozima.duckdns.org"
TAG=${1:-latest}

echo "Build and push fn-tmdt (arm64)..."
docker buildx build --platform linux/arm64 \
  --build-arg VITE_API_URL="${VITE_API_URL:-https://devb1.orifen.duckdns.org}" \
  --build-arg VITE_CACAO_URL="${VITE_CACAO_URL:-https://devcacao.orifen.duckdns.org}" \
  --build-arg VITE_GOOGLE_CLIENT_ID="${VITE_GOOGLE_CLIENT_ID}" \
  --build-arg VITE_GOOGLE_CLIENT_SECRET="${VITE_GOOGLE_CLIENT_SECRET}" \
  --build-arg VITE_GOOGLE_REDIRECT_URI="${VITE_GOOGLE_REDIRECT_URI}" \
  --build-arg VITE_FACEBOOK_CLIENT_ID="${VITE_FACEBOOK_CLIENT_ID}" \
  --build-arg VITE_FACEBOOK_CLIENT_SECRET="${VITE_FACEBOOK_CLIENT_SECRET}" \
  --build-arg VITE_FACEBOOK_REDIRECT_URI="${VITE_FACEBOOK_REDIRECT_URI}" \
  -t ${REGISTRY}/fn-tmdt:${TAG} ./fn-tmdt --push --no-cache

echo "Build and push fn-admin (arm64)..."
docker buildx build --platform linux/arm64 \
  --build-arg VITE_API_URL="${VITE_API_URL:-https://devb1.orifen.duckdns.org}" \
  -t ${REGISTRY}/fn-admin:${TAG} ./fn-admin --push --no-cache

echo "Build and push bk-tmdt (arm64)..."
docker buildx build --platform linux/arm64 \
  --build-arg TEST=true \
  -t ${REGISTRY}/bk-tmdt:${TAG} ./bk-tmdt --push --no-cache

echo "Build and push bk-cacao (arm64)..."
docker buildx build --platform linux/arm64 \
  --build-arg TEST=true \
  -t ${REGISTRY}/bk-cacao:${TAG} ./bk-cacao --push --no-cache

echo "Push done."
