# Admin UI - Azure Container Apps Deployment

## Overview

This guide covers deploying Admin UI to Azure Container Apps as a containerized React application served by nginx.

## Prerequisites

- Azure CLI installed and authenticated
- Docker installed and running
- Azure subscription with required permissions
- Azure Container Registry (ACR) created

## Deployment Methods

### Method 1: Using Deployment Script (Recommended)

```bash
cd scripts
./aca.sh
```

The script will prompt for configuration and handle:

- Resource group verification
- ACR image build and push
- Container App creation/update

### Method 2: Manual Deployment

#### 1. Build Docker Image

```bash
# Set variables
ACR_NAME="acrxshopaiaca"
IMAGE_TAG="${ACR_NAME}.azurecr.io/admin-ui:latest"

# Build with build args
docker build \
  --build-arg REACT_APP_BFF_URL=https://web-bff.internal.example.com \
  -t $IMAGE_TAG .
```

#### 2. Push to ACR

```bash
az acr login --name $ACR_NAME
docker push $IMAGE_TAG
```

#### 3. Deploy Container App

```bash
az containerapp create \
  --name admin-ui \
  --resource-group rg-xshopai-aca \
  --environment cae-xshopai-aca \
  --image $IMAGE_TAG \
  --target-port 80 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3
```

## Configuration

### Environment Variables at Build Time

React apps require environment variables at **build time**:

| Variable            | Description              |
| ------------------- | ------------------------ |
| `REACT_APP_BFF_URL` | Web BFF API endpoint URL |

### nginx Configuration

The Dockerfile uses nginx to serve the static build. Custom configuration is in `nginx.conf`.

## Architecture

```
Internet → Azure Container Apps (admin-ui:80)
                    ↓
              nginx serving static React build
                    ↓
              API calls to Web BFF (Dapr service invocation)
```

## Monitoring

### View Logs

```bash
az containerapp logs show \
  --name admin-ui \
  --resource-group rg-xshopai-aca \
  --type console \
  --follow
```

### Check Status

```bash
az containerapp show \
  --name admin-ui \
  --resource-group rg-xshopai-aca \
  --query "properties.runningStatus"
```

## Scaling

Configure autoscaling based on HTTP traffic:

```bash
az containerapp update \
  --name admin-ui \
  --resource-group rg-xshopai-aca \
  --min-replicas 1 \
  --max-replicas 10 \
  --scale-rule-name http-rule \
  --scale-rule-type http \
  --scale-rule-http-concurrency 100
```

## Troubleshooting

### Blank Page After Deployment

- Check browser console for errors
- Verify `REACT_APP_BFF_URL` was set correctly during build
- Check nginx logs for 404 errors

### API Calls Failing

- Verify Web BFF is accessible from the Container App
- Check CORS configuration on Web BFF
