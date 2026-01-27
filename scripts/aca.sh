#!/bin/bash

# ============================================================================
# Azure Container Apps Deployment Script for Admin UI
# ============================================================================
# This script automates the deployment of Admin UI to Azure Container Apps
# as a static web app served by nginx.
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() { echo -e "\n${BLUE}============================================================================${NC}\n${BLUE}$1${NC}\n${BLUE}============================================================================${NC}\n"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

prompt_with_default() {
    local prompt="$1" default="$2" varname="$3"
    read -p "$prompt [$default]: " input
    eval "$varname=\"${input:-$default}\""
}

# ============================================================================
# Prerequisites Check
# ============================================================================
print_header "Checking Prerequisites"

command -v az &> /dev/null || { print_error "Azure CLI is not installed"; exit 1; }
print_success "Azure CLI is installed"

command -v docker &> /dev/null || { print_error "Docker is not installed"; exit 1; }
print_success "Docker is installed"

az account show &> /dev/null || { print_warning "Not logged into Azure"; az login; }
print_success "Logged into Azure"

# ============================================================================
# Configuration
# ============================================================================
print_header "Azure Configuration"

echo -e "\n${BLUE}Available Azure Subscriptions:${NC}"
az account list --query "[].{Name:name, SubscriptionId:id, IsDefault:isDefault}" --output table

prompt_with_default "Enter Azure Subscription ID (leave empty for default)" "" SUBSCRIPTION_ID
[ -n "$SUBSCRIPTION_ID" ] && az account set --subscription "$SUBSCRIPTION_ID"
SUBSCRIPTION_ID=${SUBSCRIPTION_ID:-$(az account show --query id -o tsv)}

prompt_with_default "Enter Resource Group name" "rg-xshopai-aca" RESOURCE_GROUP
prompt_with_default "Enter Azure Location" "swedencentral" LOCATION
prompt_with_default "Enter Azure Container Registry name" "acrxshopaiaca" ACR_NAME
prompt_with_default "Enter Container Apps Environment name" "cae-xshopai-aca" ENVIRONMENT_NAME
prompt_with_default "Enter BFF API URL" "https://web-bff.internal.cae-xshopai-aca.swedencentral.azurecontainerapps.io" REACT_APP_BFF_URL

APP_NAME="admin-ui"

# ============================================================================
# Confirmation
# ============================================================================
print_header "Deployment Configuration Summary"
echo "Resource Group:       $RESOURCE_GROUP"
echo "Location:             $LOCATION"
echo "Container Registry:   $ACR_NAME"
echo "Environment:          $ENVIRONMENT_NAME"
echo "BFF API URL:          $REACT_APP_BFF_URL"
echo "App Name:             $APP_NAME"

read -p "Do you want to proceed with deployment? (y/N): " CONFIRM
[[ ! "$CONFIRM" =~ ^[Yy]$ ]] && { print_warning "Deployment cancelled"; exit 0; }

# ============================================================================
# Deploy
# ============================================================================
print_header "Step 1: Verifying Resource Group"
az group exists --name "$RESOURCE_GROUP" | grep -q "true" || az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none
print_success "Resource group ready"

print_header "Step 2: Verifying Container Registry"
az acr show --name "$ACR_NAME" &> /dev/null || az acr create --resource-group "$RESOURCE_GROUP" --name "$ACR_NAME" --sku Basic --admin-enabled true --output none
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer -o tsv)
print_success "ACR ready: $ACR_LOGIN_SERVER"

print_header "Step 3: Building and Pushing Container Image"
az acr login --name "$ACR_NAME"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$(dirname "$SCRIPT_DIR")"
cd "$SERVICE_DIR"

IMAGE_TAG="${ACR_LOGIN_SERVER}/${APP_NAME}:latest"
print_info "Building image: $IMAGE_TAG"
docker build --build-arg REACT_APP_BFF_URL="$REACT_APP_BFF_URL" -t "$IMAGE_TAG" .
docker push "$IMAGE_TAG"
print_success "Image pushed to ACR"

print_header "Step 4: Verifying Container Apps Environment"
az containerapp env show --name "$ENVIRONMENT_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null || \
    az containerapp env create --name "$ENVIRONMENT_NAME" --resource-group "$RESOURCE_GROUP" --location "$LOCATION" --output none
print_success "Environment ready"

print_header "Step 5: Deploying Container App"
if az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    az containerapp update --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --image "$IMAGE_TAG" --output none
else
    az containerapp create \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --environment "$ENVIRONMENT_NAME" \
        --image "$IMAGE_TAG" \
        --registry-server "$ACR_LOGIN_SERVER" \
        --target-port 80 \
        --ingress external \
        --min-replicas 1 \
        --max-replicas 3 \
        --cpu 0.25 \
        --memory 0.5Gi \
        --output none
fi
print_success "Container app deployed"

# ============================================================================
# Summary
# ============================================================================
print_header "Deployment Complete!"
APP_URL=$(az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.configuration.ingress.fqdn" -o tsv)
echo -e "${GREEN}Admin UI deployed successfully!${NC}"
echo -e "${YELLOW}Public URL:${NC} https://$APP_URL"
echo -e "\n${YELLOW}Useful Commands:${NC}"
echo "  az containerapp logs show --name $APP_NAME --resource-group $RESOURCE_GROUP --type console --follow"
