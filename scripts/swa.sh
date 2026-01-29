#!/bin/bash

# ============================================================================
# Azure Static Web Apps Deployment Script for Admin UI
# ============================================================================
# This script deploys the Admin UI to Azure Static Web Apps.
# 
# Static Web Apps is ideal for SPAs because:
#   - Free tier available
#   - Global CDN built-in
#   - Automatic SSL certificates
#   - No container overhead
#   - Instant deployments (no cold starts)
#
# PREREQUISITE: Run the infrastructure deployment script first:
#   cd infrastructure/azure/aca/scripts
#   ./deploy-infra.sh
# ============================================================================

set -e

# -----------------------------------------------------------------------------
# Colors for output
# -----------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "\n${BLUE}==============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}==============================================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# ============================================================================
# Prerequisites Check
# ============================================================================
print_header "Checking Prerequisites"

# Check Azure CLI
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi
print_success "Azure CLI is installed"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi
print_success "Node.js is installed: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install Node.js/npm first."
    exit 1
fi
print_success "npm is installed: $(npm --version)"

# Check if logged into Azure
if ! az account show &> /dev/null; then
    print_warning "Not logged into Azure. Initiating login..."
    az login
fi
print_success "Logged into Azure"

# ============================================================================
# Configuration
# ============================================================================
print_header "Configuration"

# Service-specific configuration
SERVICE_NAME="admin-ui"
PROJECT_NAME="xshopai"

# Get script directory and service directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$(dirname "$SCRIPT_DIR")"


# ============================================================================
# Environment Selection
# ============================================================================
echo -e "${CYAN}Available Environments:${NC}"
echo "   dev     - Development environment"
echo "   prod    - Production environment"
echo ""

read -p "Enter environment (dev/prod) [dev]: " ENVIRONMENT
ENVIRONMENT="${ENVIRONMENT:-dev}"

if [[ ! "$ENVIRONMENT" =~ ^(dev|prod)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    echo "   Valid values: dev, prod"
    exit 1
fi
print_success "Environment: $ENVIRONMENT"

# ============================================================================
# Suffix Configuration
# ============================================================================
print_header "Infrastructure Configuration"

echo -e "${CYAN}The suffix was set during infrastructure deployment.${NC}"
echo "You can find it by running:"
echo -e "   ${BLUE}az group list --query \"[?starts_with(name, 'rg-xshopai-$ENVIRONMENT')].{Name:name, Suffix:tags.suffix}\" -o table${NC}"
echo ""

read -p "Enter the infrastructure suffix: " SUFFIX

if [ -z "$SUFFIX" ]; then
    print_error "Suffix is required. Please run the infrastructure deployment first."
    exit 1
fi

# Validate suffix format
if [[ ! "$SUFFIX" =~ ^[a-z0-9]{3,6}$ ]]; then
    print_error "Invalid suffix format: $SUFFIX"
    echo "   Suffix must be 3-6 lowercase alphanumeric characters."
    exit 1
fi
print_success "Using suffix: $SUFFIX"

# ============================================================================
# Derive Resource Names from Infrastructure
# ============================================================================
RESOURCE_GROUP="rg-${PROJECT_NAME}-${ENVIRONMENT}-${SUFFIX}"
SWA_NAME="swa-${PROJECT_NAME}-admin-${ENVIRONMENT}-${SUFFIX}"

print_info "Derived resource names:"
echo "   Resource Group:      $RESOURCE_GROUP"
echo "   Static Web App:      $SWA_NAME"
echo ""

# ============================================================================
# Verify Infrastructure Exists
# ============================================================================
print_header "Verifying Infrastructure"

# Check Resource Group
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    print_error "Resource group '$RESOURCE_GROUP' does not exist."
    echo ""
    echo "Please run the infrastructure deployment first:"
    echo -e "   ${BLUE}cd infrastructure/azure/aca/scripts${NC}"
    echo -e "   ${BLUE}./deploy-infra.sh${NC}"
    exit 1
fi
print_success "Resource Group exists: $RESOURCE_GROUP"

# Get location from resource group (for reference)
RG_LOCATION=$(az group show --name "$RESOURCE_GROUP" --query location -o tsv)
print_success "Resource Group Location: $RG_LOCATION"

# Static Web Apps is only available in specific regions:
# westus2, centralus, eastus2, westeurope, eastasia
# Map to closest available SWA region
case "$RG_LOCATION" in
    swedencentral|northeurope|westeurope|uksouth|ukwest|francecentral|germanywestcentral)
        SWA_LOCATION="westeurope"
        ;;
    eastus|eastus2|canadaeast|canadacentral)
        SWA_LOCATION="eastus2"
        ;;
    westus|westus2|westus3)
        SWA_LOCATION="westus2"
        ;;
    centralus|northcentralus|southcentralus)
        SWA_LOCATION="centralus"
        ;;
    eastasia|southeastasia|japaneast|japanwest|australiaeast|koreacentral)
        SWA_LOCATION="eastasia"
        ;;
    *)
        SWA_LOCATION="westeurope"  # Default fallback
        ;;
esac
print_success "Static Web App Location: $SWA_LOCATION (SWA has limited region availability)"


# ============================================================================
# Web BFF URL Detection
# ============================================================================
print_header "Web BFF Configuration"

print_info "Admin UI calls Web BFF directly (CORS must be enabled on web-bff)"
EXISTING_BFF_URL=$(az containerapp show --name web-bff --resource-group "$RESOURCE_GROUP" --query "properties.configuration.ingress.fqdn" --output tsv 2>/dev/null || echo "")
if [ -n "$EXISTING_BFF_URL" ]; then
    WEB_BFF_URL="https://$EXISTING_BFF_URL"
    print_success "Found existing Web BFF: $WEB_BFF_URL"
else
    print_warning "Web BFF not found in resource group."
    echo ""
    read -p "Enter Web BFF URL: " WEB_BFF_URL
    if [ -z "$WEB_BFF_URL" ]; then
        print_error "Web BFF URL is required for Static Web Apps deployment."
        exit 1
    fi
fi

# ============================================================================
# Confirmation
# ============================================================================
print_header "Deployment Configuration Summary"

echo -e "${CYAN}Environment:${NC}          $ENVIRONMENT"
echo -e "${CYAN}Suffix:${NC}               $SUFFIX"
echo -e "${CYAN}Resource Group:${NC}       $RESOURCE_GROUP"
echo -e "${CYAN}SWA Location:${NC}         $SWA_LOCATION"
echo ""
echo -e "${CYAN}Service Configuration:${NC}"
echo -e "   Static Web App:    $SWA_NAME"
echo -e "   Web BFF URL:       $WEB_BFF_URL"
echo ""

read -p "Do you want to proceed with deployment? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled by user"
    exit 0
fi

# ============================================================================
# Step 1: Create Static Web App (if needed)
# ============================================================================
print_header "Step 1: Creating Static Web App"

if az staticwebapp show --name "$SWA_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    print_info "Static Web App '$SWA_NAME' already exists"
else
    print_info "Creating Static Web App '$SWA_NAME'..."
    az staticwebapp create \
        --name "$SWA_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$SWA_LOCATION" \
        --sku Free \
        --output none
    print_success "Static Web App created"
fi

# Get deployment token
print_info "Getting deployment token..."
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name "$SWA_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.apiKey" -o tsv)

if [ -z "$DEPLOYMENT_TOKEN" ]; then
    print_error "Failed to get deployment token"
    exit 1
fi
print_success "Deployment token retrieved"

# ============================================================================
# Step 2: Build React Application
# ============================================================================
print_header "Step 2: Building React Application"

cd "$SERVICE_DIR"

# Install dependencies
print_info "Installing dependencies..."
npm ci
print_success "Dependencies installed"

# Build with BFF URL
print_info "Building React app with REACT_APP_BFF_API_URL=$WEB_BFF_URL"
REACT_APP_BFF_API_URL="$WEB_BFF_URL" npm run build
print_success "React app built"

# ============================================================================
# Step 3: Deploy to Static Web App
# ============================================================================
print_header "Step 3: Deploying to Static Web App"

# Check if SWA CLI is installed
if ! command -v swa &> /dev/null; then
    print_info "Installing SWA CLI..."
    npm install -g @azure/static-web-apps-cli
fi

# Deploy using SWA CLI
print_info "Deploying to Azure Static Web Apps..."
swa deploy ./build \
    --deployment-token "$DEPLOYMENT_TOKEN" \
    --env production

print_success "Deployment completed"

# ============================================================================
# Step 4: Get Application URL
# ============================================================================
print_header "Step 4: Verifying Deployment"

APP_URL=$(az staticwebapp show \
    --name "$SWA_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "defaultHostname" -o tsv)

print_success "Static Web App deployed!"
echo ""
print_info "Application URL: https://$APP_URL"
echo ""

# Test the deployment
print_info "Testing deployment..."
sleep 10
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "https://$APP_URL" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    print_success "Health check passed! (HTTP $HTTP_STATUS)"
else
    print_warning "Health check returned HTTP $HTTP_STATUS. The app may still be propagating."
fi

# ============================================================================
# Summary
# ============================================================================
print_header "Deployment Summary"

echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}   ✅ $SERVICE_NAME DEPLOYED TO AZURE STATIC WEB APPS${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""
echo -e "${CYAN}Application:${NC}"
echo "   URL:              https://$APP_URL"
echo ""
echo -e "${CYAN}Infrastructure:${NC}"
echo "   Resource Group:   $RESOURCE_GROUP"
echo "   Static Web App:   $SWA_NAME"
echo "   SKU:              Free"
echo ""
echo -e "${CYAN}Configuration:${NC}"
echo "   Web BFF URL:      $WEB_BFF_URL (baked into build)"
echo ""
echo -e "${CYAN}Features:${NC}"
echo "   ✓ Global CDN"
echo "   ✓ Free SSL certificate"
echo "   ✓ No container overhead"
echo "   ✓ Instant deployments"
echo ""
echo -e "${CYAN}Useful Commands:${NC}"
echo -e "   View app:         ${BLUE}az staticwebapp show --name $SWA_NAME --resource-group $RESOURCE_GROUP${NC}"
echo -e "   Delete app:       ${BLUE}az staticwebapp delete --name $SWA_NAME --resource-group $RESOURCE_GROUP --yes${NC}"
echo -e "   Redeploy:         ${BLUE}./swa.sh${NC}"
echo ""
echo -e "${YELLOW}⚠️  Important: Ensure CORS is enabled on web-bff for https://$APP_URL${NC}"
echo ""
echo -e "${CYAN}Test the deployment:${NC}"
echo "   Open in browser: https://$APP_URL"
echo ""
