#!/bin/bash
# ============================================================================
# Azure Static Web Apps Deployment Script for Admin UI
# ============================================================================
# PREREQUISITE: Run infrastructure deployment first:
#   cd infrastructure/azure/aca/scripts && ./deploy.sh
# ============================================================================

set -e

# ============================================================================
# CONFIGURATION
# ============================================================================
SERVICE_NAME="admin-ui"
PROJECT_NAME="xshopai"

# Static Web Apps benefits:
#   - Standard tier: Custom domains, more bandwidth, SLA
#   - Global CDN, Auto SSL, No cold starts

# ============================================================================
# COLORS & HELPERS
# ============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() { echo -e "\n${BLUE}=== $1 ===${NC}\n"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ $1${NC}"; }

# ============================================================================
# PREREQUISITES CHECK
# ============================================================================
print_header "Checking Prerequisites"

command -v az &>/dev/null || { print_error "Azure CLI not installed"; exit 1; }
print_success "Azure CLI installed"

command -v node &>/dev/null || { print_error "Node.js not installed"; exit 1; }
print_success "Node.js installed"

az account show &>/dev/null || az login
print_success "Logged into Azure"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$(dirname "$SCRIPT_DIR")"

# ============================================================================
# USER INPUT
# ============================================================================
print_header "Environment Selection"

echo "Available environments: dev, prod"
read -p "Enter environment [dev]: " ENVIRONMENT
ENVIRONMENT="${ENVIRONMENT:-dev}"

[[ "$ENVIRONMENT" =~ ^(dev|prod)$ ]] || { print_error "Invalid environment"; exit 1; }
print_success "Environment: $ENVIRONMENT"

echo ""
echo "Find your suffix by running:"
echo -e "  ${BLUE}az group list --query \"[?starts_with(name, 'rg-xshopai-$ENVIRONMENT')].name\" -o tsv${NC}"
echo ""
read -p "Enter infrastructure suffix: " SUFFIX

[[ "$SUFFIX" =~ ^[a-z0-9]{3,6}$ ]] || { print_error "Invalid suffix"; exit 1; }
print_success "Suffix: $SUFFIX"

# ============================================================================
# DERIVED RESOURCE NAMES
# ============================================================================
RESOURCE_GROUP="rg-${PROJECT_NAME}-${ENVIRONMENT}-${SUFFIX}"
SWA_NAME="swa-${SERVICE_NAME}-${ENVIRONMENT}-${SUFFIX}"
BFF_APP_NAME="ca-web-bff-${ENVIRONMENT}-${SUFFIX}"
KEY_VAULT_NAME="kv-${PROJECT_NAME}-${ENVIRONMENT}-${SUFFIX}"

# Map to SWA-available region (SWA has limited regions)
RG_LOCATION=$(az group show --name "$RESOURCE_GROUP" --query location -o tsv 2>/dev/null) || { print_error "Resource group not found"; exit 1; }
case "$RG_LOCATION" in
    swedencentral|northeurope|westeurope|uksouth|francecentral) SWA_LOCATION="westeurope" ;;
    eastus|eastus2|canadaeast) SWA_LOCATION="eastus2" ;;
    westus|westus2|westus3) SWA_LOCATION="westus2" ;;
    centralus|northcentralus|southcentralus) SWA_LOCATION="centralus" ;;
    *) SWA_LOCATION="westeurope" ;;
esac

# ============================================================================
# VERIFY INFRASTRUCTURE
# ============================================================================
print_header "Verifying Infrastructure"

print_success "Resource Group: $RESOURCE_GROUP"
print_success "SWA Location: $SWA_LOCATION"

# Auto-detect web-bff URL
WEB_BFF_URL=$(az containerapp show --name "$BFF_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.configuration.ingress.fqdn" -o tsv 2>/dev/null || echo "")
if [ -n "$WEB_BFF_URL" ]; then
    WEB_BFF_URL="https://$WEB_BFF_URL"
    print_success "Web BFF: $WEB_BFF_URL"
else
    print_error "Web BFF not found. Deploy web-bff first."
    exit 1
fi

# Get Application Insights connection string from Key Vault
APPINSIGHTS_CONNECTION_STRING=$(az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "appinsights-connection" --query "value" -o tsv 2>/dev/null || echo "")
if [ -n "$APPINSIGHTS_CONNECTION_STRING" ]; then
    print_success "Application Insights: configured"
else
    print_warning "Application Insights: not configured (telemetry disabled)"
fi

# ============================================================================
# CONFIRMATION
# ============================================================================
print_header "Deployment Summary"

echo "Environment:        $ENVIRONMENT"
echo "Resource Group:     $RESOURCE_GROUP"
echo "Static Web App:     $SWA_NAME"
echo "Web BFF URL:        $WEB_BFF_URL"
echo ""

# ============================================================================
# CREATE STATIC WEB APP
# ============================================================================
print_header "Creating Static Web App"

if az staticwebapp show --name "$SWA_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
    print_info "Static Web App already exists"
else
    print_info "Creating Static Web App..."
    az staticwebapp create \
        --name "$SWA_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$SWA_LOCATION" \
        --sku Standard \
        --tags "project=$PROJECT_NAME" "environment=$ENVIRONMENT" "suffix=$SUFFIX" "service=$SERVICE_NAME" \
        --output none
    print_success "Static Web App created"
fi

# Get deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list --name "$SWA_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.apiKey" -o tsv)
[ -n "$DEPLOYMENT_TOKEN" ] && print_success "Deployment token retrieved" || { print_error "Failed to get deployment token"; exit 1; }

# ============================================================================
# BUILD REACT APP
# ============================================================================
print_header "Building React Application"

cd "$SERVICE_DIR"

print_info "Installing dependencies..."
npm ci --silent
print_success "Dependencies installed"

print_info "Building with:"
echo "  REACT_APP_BFF_API_URL=$WEB_BFF_URL"
echo "  REACT_APP_APPINSIGHTS_CONNECTION_STRING=${APPINSIGHTS_CONNECTION_STRING:+[configured]}"

REACT_APP_BFF_API_URL="$WEB_BFF_URL" \
REACT_APP_APPINSIGHTS_CONNECTION_STRING="$APPINSIGHTS_CONNECTION_STRING" \
npm run build
print_success "Build complete"

# ============================================================================
# DEPLOY TO SWA
# ============================================================================
print_header "Deploying to Static Web App"

# Install SWA CLI if needed
command -v swa &>/dev/null || { print_info "Installing SWA CLI..."; npm install -g @azure/static-web-apps-cli; }

print_info "Deploying..."
swa deploy ./build --deployment-token "$DEPLOYMENT_TOKEN" --env production
print_success "Deployment complete"

# ============================================================================
# UPDATE WEB-BFF CORS
# ============================================================================
print_header "Configuring CORS on Web BFF"

APP_URL=$(az staticwebapp show --name "$SWA_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostname" -o tsv)
SWA_ORIGIN="https://$APP_URL"

# Get current CORS origins from web-bff ingress
CURRENT_CORS=$(az containerapp show --name "$BFF_APP_NAME" --resource-group "$RESOURCE_GROUP" \
    --query "properties.configuration.ingress.corsPolicy.allowedOrigins" -o tsv 2>/dev/null || echo "")

if [[ "$CURRENT_CORS" == *"$APP_URL"* ]]; then
    print_success "CORS already configured for $SWA_ORIGIN"
else
    print_info "Adding $SWA_ORIGIN to web-bff CORS policy..."
    
    # Build new origins list (keep existing + add new)
    CORS_ORIGINS="$SWA_ORIGIN http://localhost:3000 http://localhost:3001"
    
    # Add customer-ui if it exists
    CUSTOMER_UI_URL=$(az staticwebapp show --name "swa-customer-ui-${ENVIRONMENT}-${SUFFIX}" --resource-group "$RESOURCE_GROUP" --query "defaultHostname" -o tsv 2>/dev/null || echo "")
    [ -n "$CUSTOMER_UI_URL" ] && CORS_ORIGINS="https://$CUSTOMER_UI_URL $CORS_ORIGINS"
    
    az containerapp ingress cors update \
        --name "$BFF_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --allowed-origins $CORS_ORIGINS \
        --allowed-methods GET POST PUT PATCH DELETE OPTIONS \
        --allowed-headers "*" \
        --expose-headers traceparent x-correlation-id \
        --allow-credentials true \
        --output none
    
    print_success "CORS updated on web-bff for $SWA_ORIGIN"
fi

# ============================================================================
# VERIFY DEPLOYMENT
# ============================================================================
print_header "Verifying Deployment"

echo ""
echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL${NC}"
echo ""
echo "Application URL:  https://$APP_URL"
echo "Web BFF URL:      $WEB_BFF_URL"
echo ""
echo "Useful commands:"
echo -e "  View:    ${BLUE}az staticwebapp show --name $SWA_NAME --resource-group $RESOURCE_GROUP${NC}"
echo -e "  Delete:  ${BLUE}az staticwebapp delete --name $SWA_NAME --resource-group $RESOURCE_GROUP --yes${NC}"
echo ""

# Test deployment
print_info "Testing deployment..."
sleep 5
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "https://$APP_URL" 2>/dev/null || echo "000")
[ "$HTTP_STATUS" = "200" ] && print_success "Health check passed!" || print_warning "HTTP $HTTP_STATUS (may still be propagating)"
