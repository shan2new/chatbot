#!/bin/bash

# Set variables
ECR_REGISTRY="637423193263.dkr.ecr.eu-north-1.amazonaws.com"
FRONTEND_IMAGE_NAME="chatbot-demo-frontend"
BACKEND_IMAGE_NAME="chatbot-demo-backend"
PLATFORM="linux/amd64"

# Function to build and push Docker image
build_and_push() {
    local service_dir=$1
    local image_name=$2

    echo "Building Docker image for ${service_dir}..."
    docker build --platform ${PLATFORM} -t ${ECR_REGISTRY}/${image_name}:latest ${service_dir}

    echo "Pushing Docker image ${ECR_REGISTRY}/${image_name}:latest..."
    docker push ${ECR_REGISTRY}/${image_name}:latest

    # Output image digest
    local digest=$(docker inspect --format='{{index .RepoDigests 0}}' ${ECR_REGISTRY}/${image_name}:latest)
    echo "Pushed image digest: ${digest}"
}

# Login to ECR
echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Build and push frontend image
build_and_push "./frontend" ${FRONTEND_IMAGE_NAME}

# Build and push backend image
build_and_push "./backend" ${BACKEND_IMAGE_NAME}

echo "Docker images built and pushed successfully."
