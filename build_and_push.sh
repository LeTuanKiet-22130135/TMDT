#!/bin/bash
set -e

REGISTRY="hub.hizozima.duckdns.org"
TAG=${1:-latest}

echo "Build and push fn-tmdt (arm64)..."
docker buildx build --platform linux/arm64 \
  --build-arg VITE_API_URL="${VITE_API_URL:-https://api.hizozima.duckdns.org}" \
  --build-arg VITE_CACAO_URL="${VITE_CACAO_URL:-https://cacao.hizozima.duckdns.org}" \
  -t ${REGISTRY}/fn-tmdt:${TAG} ./fn-tmdt --push

echo "Build and push fn-admin (arm64)..."
docker buildx build --platform linux/arm64 \
  --build-arg VITE_API_URL="${VITE_API_URL:-https://api.hizozima.duckdns.org}" \
  -t ${REGISTRY}/fn-admin:${TAG} ./fn-admin --push

echo "Build and push bk-tmdt (arm64)..."
docker buildx build --platform linux/arm64 -t ${REGISTRY}/bk-tmdt:${TAG} ./bk-tmdt --push

echo "Build and push bk-cacao (arm64)..."
docker buildx build --platform linux/arm64 -t ${REGISTRY}/bk-cacao:${TAG} ./bk-cacao --push

echo "Push done."
