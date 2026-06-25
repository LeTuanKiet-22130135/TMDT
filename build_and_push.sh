#!/bin/bash
set -e

REGISTRY="hub.hizozima.duckdns.org"
TAG=${1:-latest}

echo "Build and push fn-tmdt (arm64)..."
docker buildx build --platform linux/arm64 -t ${REGISTRY}/fn-tmdt:${TAG} ./fn-tmdt --push

echo "Build and push fn-admin (arm64)..."
docker buildx build --platform linux/arm64 -t ${REGISTRY}/fn-admin:${TAG} ./fn-admin --push

echo "Build and push bk-tmdt (arm64)..."
docker buildx build --platform linux/arm64 -t ${REGISTRY}/bk-tmdt:${TAG} ./bk-tmdt --push

echo "Build and push bk-cacao (arm64)..."
docker buildx build --platform linux/arm64 -t ${REGISTRY}/bk-cacao:${TAG} ./bk-cacao --push

echo "Push done."
