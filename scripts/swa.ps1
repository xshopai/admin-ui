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
#   ./deploy-infra.ps1
# ============================================================================

#Requires -Version 5.1

param(
    [switch]$SkipConfirmation
)

$ErrorActionPreference = "Stop"

# -----------------------------------------------------------------------------
# Colors for output
# -----------------------------------------------------------------------------
function Write-Header {
    param([string]$Message)
    Write-Host "`n==============================================================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "==============================================================================`n" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Get-UserInput {
    param(
        [string]$Prompt,
        [string]$Default
    )
    
    if ($Default) {
        $input = Read-Host "$Prompt [$Default]"
        if ([string]::IsNullOrWhiteSpace($input)) {
            return $Default
        }
        return $input
    }
    else {
        return Read-Host $Prompt
    }
}

# ============================================================================
# Prerequisites Check
# ============================================================================
Write-Header "Checking Prerequisites"

# Check Azure CLI
try {
    $null = az --version
    Write-Success "Azure CLI is installed"
}
catch {
    Write-Error "Azure CLI is not installed. Please install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js is installed: $nodeVersion"
}
catch {
    Write-Error "Node.js is not installed. Please install Node.js first."
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Success "npm is installed: $npmVersion"
}
catch {
    Write-Error "npm is not installed. Please install Node.js/npm first."
    exit 1
}

# Check if logged into Azure
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Warning "Not logged into Azure. Initiating login..."
    az login
    $account = az account show | ConvertFrom-Json
}
Write-Success "Logged into Azure"

# ============================================================================
# Configuration
# ============================================================================
Write-Header "Configuration"

# Service-specific configuration
$ServiceName = "admin-ui"
$ProjectName = "xshopai"

# Get script directory and service directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServiceDir = Split-Path -Parent $ScriptDir

# ============================================================================
# Environment Selection
# ============================================================================
Write-Host "Available Environments:" -ForegroundColor Cyan
Write-Host "   dev     - Development environment"
Write-Host "   prod    - Production environment"
Write-Host ""

$Environment = Get-UserInput -Prompt "Enter environment (dev/prod)" -Default "dev"

if ($Environment -notmatch '^(dev|prod)$') {
    Write-Error "Invalid environment: $Environment"
    Write-Host "   Valid values: dev, prod"
    exit 1
}
Write-Success "Environment: $Environment"

# ============================================================================
# Suffix Configuration
# ============================================================================
Write-Header "Infrastructure Configuration"

Write-Host "The suffix was set during infrastructure deployment." -ForegroundColor Cyan
Write-Host "You can find it by running:"
Write-Host "   az group list --query `"[?starts_with(name, 'rg-xshopai-$Environment')].{Name:name, Suffix:tags.suffix}`" -o table" -ForegroundColor Blue
Write-Host ""

$Suffix = Get-UserInput -Prompt "Enter the infrastructure suffix" -Default ""

if ([string]::IsNullOrWhiteSpace($Suffix)) {
    Write-Error "Suffix is required. Please run the infrastructure deployment first."
    exit 1
}

# Validate suffix format
if ($Suffix -notmatch '^[a-z0-9]{3,6}$') {
    Write-Error "Invalid suffix format: $Suffix"
    Write-Host "   Suffix must be 3-6 lowercase alphanumeric characters."
    exit 1
}
Write-Success "Using suffix: $Suffix"

# ============================================================================
# Derive Resource Names from Infrastructure
# ============================================================================
$ResourceGroup = "rg-${ProjectName}-${Environment}-${Suffix}"
$SwaName = "swa-${ProjectName}-admin-${Environment}-${Suffix}"

Write-Info "Derived resource names:"
Write-Host "   Resource Group:      $ResourceGroup"
Write-Host "   Static Web App:      $SwaName"
Write-Host ""

# ============================================================================
# Verify Infrastructure Exists
# ============================================================================
Write-Header "Verifying Infrastructure"

# Check Resource Group
$rgExists = az group show --name $ResourceGroup 2>$null
if (-not $rgExists) {
    Write-Error "Resource group '$ResourceGroup' does not exist."
    Write-Host ""
    Write-Host "Please run the infrastructure deployment first:"
    Write-Host "   cd infrastructure/azure/aca/scripts" -ForegroundColor Blue
    Write-Host "   ./deploy-infra.ps1" -ForegroundColor Blue
    exit 1
}
Write-Success "Resource Group exists: $ResourceGroup"

# Get location from resource group (for reference)
$RgLocation = (az group show --name $ResourceGroup --query location -o tsv)
Write-Success "Resource Group Location: $RgLocation"

# Static Web Apps is only available in specific regions:
# westus2, centralus, eastus2, westeurope, eastasia
# Map to closest available SWA region
$SwaLocation = switch -Regex ($RgLocation) {
    '^(swedencentral|northeurope|westeurope|uksouth|ukwest|francecentral|germanywestcentral)$' { "westeurope" }
    '^(eastus|eastus2|canadaeast|canadacentral)$' { "eastus2" }
    '^(westus|westus2|westus3)$' { "westus2" }
    '^(centralus|northcentralus|southcentralus)$' { "centralus" }
    '^(eastasia|southeastasia|japaneast|japanwest|australiaeast|koreacentral)$' { "eastasia" }
    default { "westeurope" }  # Default fallback
}
Write-Success "Static Web App Location: $SwaLocation (SWA has limited region availability)"

# ============================================================================
# Web BFF URL Detection
# ============================================================================
Write-Header "Web BFF Configuration"

Write-Info "Admin UI calls Web BFF directly (CORS must be enabled on web-bff)"
$existingBffUrl = az containerapp show --name web-bff --resource-group $ResourceGroup --query "properties.configuration.ingress.fqdn" --output tsv 2>$null
if ($existingBffUrl) {
    $WebBffUrl = "https://$existingBffUrl"
    Write-Success "Found existing Web BFF: $WebBffUrl"
}
else {
    Write-Warning "Web BFF not found in resource group."
    Write-Host ""
    $WebBffUrl = Get-UserInput -Prompt "Enter Web BFF URL" -Default ""
    if ([string]::IsNullOrWhiteSpace($WebBffUrl)) {
        Write-Error "Web BFF URL is required for Static Web Apps deployment."
        exit 1
    }
}

# ============================================================================
# Confirmation
# ============================================================================
Write-Header "Deployment Configuration Summary"

Write-Host "Environment:          " -NoNewline; Write-Host $Environment -ForegroundColor Cyan
Write-Host "Suffix:               " -NoNewline; Write-Host $Suffix -ForegroundColor Cyan
Write-Host "Resource Group:       " -NoNewline; Write-Host $ResourceGroup -ForegroundColor Cyan
Write-Host "SWA Location:         " -NoNewline; Write-Host $SwaLocation -ForegroundColor Cyan
Write-Host ""
Write-Host "Service Configuration:" -ForegroundColor Cyan
Write-Host "   Static Web App:    $SwaName"
Write-Host "   Web BFF URL:       $WebBffUrl"
Write-Host ""

if (-not $SkipConfirmation) {
    $confirm = Read-Host "Do you want to proceed with deployment? (y/N)"
    if ($confirm -notmatch '^[Yy]$') {
        Write-Warning "Deployment cancelled by user"
        exit 0
    }
}

# ============================================================================
# Step 1: Create Static Web App (if needed)
# ============================================================================
Write-Header "Step 1: Creating Static Web App"

$swaExists = az staticwebapp show --name $SwaName --resource-group $ResourceGroup 2>$null
if ($swaExists) {
    Write-Info "Static Web App '$SwaName' already exists"
}
else {
    Write-Info "Creating Static Web App '$SwaName'..."
    az staticwebapp create `
        --name $SwaName `
        --resource-group $ResourceGroup `
        --location $SwaLocation `
        --sku Free `
        --output none
    Write-Success "Static Web App created"
}

# Get deployment token
Write-Info "Getting deployment token..."
$DeploymentToken = (az staticwebapp secrets list `
    --name $SwaName `
    --resource-group $ResourceGroup `
    --query "properties.apiKey" -o tsv)

if ([string]::IsNullOrWhiteSpace($DeploymentToken)) {
    Write-Error "Failed to get deployment token"
    exit 1
}
Write-Success "Deployment token retrieved"

# ============================================================================
# Step 2: Build React Application
# ============================================================================
Write-Header "Step 2: Building React Application"

Push-Location $ServiceDir

try {
    # Install dependencies
    Write-Info "Installing dependencies..."
    npm ci
    Write-Success "Dependencies installed"

    # Build with BFF URL
    Write-Info "Building React app with REACT_APP_BFF_API_URL=$WebBffUrl"
    $env:REACT_APP_BFF_API_URL = $WebBffUrl
    npm run build
    Write-Success "React app built"
}
finally {
    Pop-Location
}

# ============================================================================
# Step 3: Deploy to Static Web App
# ============================================================================
Write-Header "Step 3: Deploying to Static Web App"

# Check if SWA CLI is installed
$swaCliInstalled = Get-Command swa -ErrorAction SilentlyContinue
if (-not $swaCliInstalled) {
    Write-Info "Installing SWA CLI..."
    npm install -g @azure/static-web-apps-cli
}

# Deploy using SWA CLI
Write-Info "Deploying to Azure Static Web Apps..."
Push-Location $ServiceDir
try {
    swa deploy ./build --deployment-token $DeploymentToken --env production
}
finally {
    Pop-Location
}

Write-Success "Deployment completed"

# ============================================================================
# Step 4: Get Application URL
# ============================================================================
Write-Header "Step 4: Verifying Deployment"

$AppUrl = (az staticwebapp show `
    --name $SwaName `
    --resource-group $ResourceGroup `
    --query "defaultHostname" -o tsv)

Write-Success "Static Web App deployed!"
Write-Host ""
Write-Info "Application URL: https://$AppUrl"
Write-Host ""

# Test the deployment
Write-Info "Testing deployment..."
Start-Sleep -Seconds 10

try {
    $response = Invoke-WebRequest -Uri "https://$AppUrl" -UseBasicParsing -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Success "Health check passed! (HTTP $($response.StatusCode))"
    }
}
catch {
    Write-Warning "Health check failed. The app may still be propagating."
}

# ============================================================================
# Summary
# ============================================================================
Write-Header "Deployment Summary"

Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "   ✅ $ServiceName DEPLOYED TO AZURE STATIC WEB APPS" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Application:" -ForegroundColor Cyan
Write-Host "   URL:              https://$AppUrl"
Write-Host ""
Write-Host "Infrastructure:" -ForegroundColor Cyan
Write-Host "   Resource Group:   $ResourceGroup"
Write-Host "   Static Web App:   $SwaName"
Write-Host "   SKU:              Free"
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "   Web BFF URL:      $WebBffUrl (baked into build)"
Write-Host ""
Write-Host "Features:" -ForegroundColor Cyan
Write-Host "   ✓ Global CDN"
Write-Host "   ✓ Free SSL certificate"
Write-Host "   ✓ No container overhead"
Write-Host "   ✓ Instant deployments"
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "   View app:         " -NoNewline; Write-Host "az staticwebapp show --name $SwaName --resource-group $ResourceGroup" -ForegroundColor Blue
Write-Host "   Delete app:       " -NoNewline; Write-Host "az staticwebapp delete --name $SwaName --resource-group $ResourceGroup --yes" -ForegroundColor Blue
Write-Host "   Redeploy:         " -NoNewline; Write-Host ".\swa.ps1" -ForegroundColor Blue
Write-Host ""
Write-Host "⚠️  Important: Ensure CORS is enabled on web-bff for https://$AppUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "Test the deployment:" -ForegroundColor Cyan
Write-Host "   Open in browser: https://$AppUrl"
Write-Host ""
