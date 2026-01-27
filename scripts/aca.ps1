# ============================================================================
# Azure Container Apps Deployment Script for Admin UI (PowerShell)
# ============================================================================

$ErrorActionPreference = "Stop"

function Write-Header { param([string]$Message); Write-Host "`n============================================================================" -ForegroundColor Blue; Write-Host $Message -ForegroundColor Blue; Write-Host "============================================================================`n" -ForegroundColor Blue }
function Write-Success { param([string]$Message); Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Info { param([string]$Message); Write-Host "ℹ $Message" -ForegroundColor Blue }

function Read-HostWithDefault { param([string]$Prompt, [string]$Default); $input = Read-Host "$Prompt [$Default]"; if ([string]::IsNullOrWhiteSpace($input)) { return $Default }; return $input }

Write-Header "Checking Prerequisites"
try { az version | Out-Null; Write-Success "Azure CLI installed" } catch { Write-Error "Azure CLI not installed"; exit 1 }
try { docker version | Out-Null; Write-Success "Docker installed" } catch { Write-Error "Docker not installed"; exit 1 }
try { az account show | Out-Null } catch { az login }

Write-Header "Azure Configuration"
$ResourceGroup = Read-HostWithDefault -Prompt "Enter Resource Group name" -Default "rg-xshopai-aca"
$Location = Read-HostWithDefault -Prompt "Enter Azure Location" -Default "swedencentral"
$AcrName = Read-HostWithDefault -Prompt "Enter Azure Container Registry name" -Default "acrxshopaiaca"
$EnvironmentName = Read-HostWithDefault -Prompt "Enter Container Apps Environment name" -Default "cae-xshopai-aca"

$AppName = "admin-ui"
$AppPort = 80
$BffUrl = Read-HostWithDefault -Prompt "Enter Web BFF URL" -Default "https://web-bff.internal.cae-xshopai-aca.swedencentral.azurecontainerapps.io"

$Confirm = Read-Host "Proceed with deployment? (y/N)"
if ($Confirm -notmatch '^[Yy]$') { exit 0 }

Write-Header "Building and Deploying"
$AcrLoginServer = az acr show --name $AcrName --query loginServer -o tsv
az acr login --name $AcrName

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServiceDir = Split-Path -Parent $ScriptDir
Push-Location $ServiceDir

try {
    npm ci
    npm run build
    $ImageTag = "${AcrLoginServer}/${AppName}:latest"
    docker build -t $ImageTag .
    docker push $ImageTag
    Write-Success "Image pushed: $ImageTag"
} finally { Pop-Location }

az containerapp env show --name $EnvironmentName --resource-group $ResourceGroup | Out-Null 2>$null
if ($LASTEXITCODE -ne 0) {
    az containerapp env create --name $EnvironmentName --resource-group $ResourceGroup --location $Location --output none
}

try {
    az containerapp show --name $AppName --resource-group $ResourceGroup | Out-Null
    az containerapp update --name $AppName --resource-group $ResourceGroup --image $ImageTag --output none
    Write-Success "Container app updated"
} catch {
    az containerapp create `
        --name $AppName `
        --resource-group $ResourceGroup `
        --environment $EnvironmentName `
        --image $ImageTag `
        --registry-server $AcrLoginServer `
        --target-port $AppPort `
        --ingress external `
        --min-replicas 1 `
        --max-replicas 3 `
        --cpu 0.25 `
        --memory 0.5Gi `
        --env-vars `
            "REACT_APP_BFF_URL=$BffUrl" `
        --output none
    Write-Success "Container app created"
}

$Url = az containerapp show --name $AppName --resource-group $ResourceGroup --query "properties.configuration.ingress.fqdn" -o tsv
Write-Header "Deployment Complete!"
Write-Host "Admin UI available at: https://$Url" -ForegroundColor Green
