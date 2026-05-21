param(
  [switch]$SkipLink,
  [switch]$SkipDbPush,
  [switch]$SkipFunctions,
  [switch]$SkipSecrets,
  [switch]$SkipFrontendEnv
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
$ConfigPath = Join-Path $Root ".env.supabase.local"
$ExamplePath = Join-Path $Root ".env.supabase.example"
$GeneratedSecretsPath = Join-Path $Root ".supabase-secrets.generated.env"
$FrontendEnvPath = Join-Path $Root ".env.local"

function Read-DotEnv($Path) {
  $values = @{}
  if (-not (Test-Path $Path)) {
    return $values
  }

  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if ($trimmed.Length -eq 0 -or $trimmed.StartsWith("#")) {
      continue
    }

    $equalsAt = $trimmed.IndexOf("=")
    if ($equalsAt -lt 1) {
      continue
    }

    $key = $trimmed.Substring(0, $equalsAt).Trim()
    $value = $trimmed.Substring($equalsAt + 1).Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    $values[$key] = $value
  }

  return $values
}

function Set-DotEnvValue($Path, $Key, $Value) {
  $escaped = [regex]::Escape($Key)
  $line = "$Key=$Value"

  if (-not (Test-Path $Path)) {
    Set-Content -LiteralPath $Path -Value $line
    return
  }

  $content = @(Get-Content -LiteralPath $Path)
  $matched = $false
  $next = foreach ($existing in $content) {
    if ($existing -match "^\s*$escaped\s*=") {
      $matched = $true
      $line
    } else {
      $existing
    }
  }

  if (-not $matched) {
    $next += $line
  }

  Set-Content -LiteralPath $Path -Value $next
}

function New-RandomToken([int]$ByteCount = 32) {
  $bytes = New-Object byte[] $ByteCount
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

function Require-Value($Values, $Key) {
  if (-not $Values.ContainsKey($Key) -or [string]::IsNullOrWhiteSpace($Values[$Key]) -or $Values[$Key] -like "YOUR_*") {
    throw "Missing $Key in .env.supabase.local"
  }

  return $Values[$Key]
}

function Normalize-ProjectRef($Value) {
  $trimmed = $Value.Trim().TrimEnd("/")
  if ($trimmed -match "^https://([a-z0-9]{20})\.supabase\.co$") {
    return $Matches[1]
  }

  if ($trimmed -match "^[a-z0-9]{20}$") {
    return $trimmed
  }

  throw "SUPABASE_PROJECT_REF must be a 20-character project ref like abcdefghijklmnopqrst, not a full URL."
}

function Invoke-Checked($Label, [scriptblock]$Command) {
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed with exit code $LASTEXITCODE"
  }
}

if (-not (Test-Path $ConfigPath)) {
  Copy-Item -LiteralPath $ExamplePath -Destination $ConfigPath
  Write-Host "Created .env.supabase.local from .env.supabase.example."
  Write-Host "Fill it in, then rerun: npm run supabase:wire"
  exit 1
}

$envValues = Read-DotEnv $ConfigPath

foreach ($generatedKey in @("VISITOR_SIGNING_SECRET", "VISITOR_HASH_SALT", "ABUSE_HASH_SALT", "ADMIN_API_TOKEN")) {
  if (-not $envValues.ContainsKey($generatedKey) -or [string]::IsNullOrWhiteSpace($envValues[$generatedKey])) {
    $byteCount = if ($generatedKey -eq "VISITOR_SIGNING_SECRET") { 48 } else { 32 }
    $value = New-RandomToken $byteCount
    Set-DotEnvValue $ConfigPath $generatedKey $value
    $envValues[$generatedKey] = $value
    Write-Host "Generated $generatedKey in .env.supabase.local"
  }
}

$projectRefInput = Require-Value $envValues "SUPABASE_PROJECT_REF"
$projectRef = Normalize-ProjectRef $projectRefInput
if ($projectRef -ne $projectRefInput) {
  Set-DotEnvValue $ConfigPath "SUPABASE_PROJECT_REF" $projectRef
  $envValues["SUPABASE_PROJECT_REF"] = $projectRef
  Write-Host "Normalized SUPABASE_PROJECT_REF in .env.supabase.local"
}
$dbPassword = Require-Value $envValues "SUPABASE_DB_PASSWORD"
$serviceRoleKey = Require-Value $envValues "SUPABASE_SERVICE_ROLE_KEY"
$turnstileSecret = Require-Value $envValues "TURNSTILE_SECRET_KEY"
$turnstileSiteKey = Require-Value $envValues "VITE_TURNSTILE_SITE_KEY"
$supabaseUrl = if ($envValues.ContainsKey("SUPABASE_URL") -and -not [string]::IsNullOrWhiteSpace($envValues["SUPABASE_URL"])) {
  $envValues["SUPABASE_URL"]
} else {
  "https://$projectRef.supabase.co"
}
$supabaseUrl = $supabaseUrl.TrimEnd("/")
if ($supabaseUrl -notmatch "^https://[a-z0-9]{20}\.supabase\.co$") {
  throw "SUPABASE_URL must look like https://$projectRef.supabase.co"
}
$publishableKey = $null
foreach ($key in @("VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY")) {
  if ($envValues.ContainsKey($key) -and -not [string]::IsNullOrWhiteSpace($envValues[$key]) -and $envValues[$key] -notlike "YOUR_*") {
    $publishableKey = $envValues[$key]
    break
  }
}
if ([string]::IsNullOrWhiteSpace($publishableKey)) {
  throw "Missing VITE_SUPABASE_PUBLISHABLE_KEY in .env.supabase.local. Use the Supabase publishable key, or the legacy anon key for older projects."
}
Set-DotEnvValue $ConfigPath "VITE_SUPABASE_PUBLISHABLE_KEY" $publishableKey
$publicOrigin = if ($envValues.ContainsKey("PUBLIC_APP_ORIGIN") -and -not [string]::IsNullOrWhiteSpace($envValues["PUBLIC_APP_ORIGIN"])) {
  $envValues["PUBLIC_APP_ORIGIN"]
} else {
  "http://localhost:4173"
}
$rawRetentionDays = if ($envValues.ContainsKey("RAW_EVENT_RETENTION_DAYS") -and -not [string]::IsNullOrWhiteSpace($envValues["RAW_EVENT_RETENTION_DAYS"])) {
  $envValues["RAW_EVENT_RETENTION_DAYS"]
} else {
  "7"
}

if ($envValues.ContainsKey("SUPABASE_ACCESS_TOKEN") -and -not [string]::IsNullOrWhiteSpace($envValues["SUPABASE_ACCESS_TOKEN"])) {
  if ($envValues["SUPABASE_ACCESS_TOKEN"] -match "^sbp_[0-9a-fA-F]{40}$") {
    $env:SUPABASE_ACCESS_TOKEN = $envValues["SUPABASE_ACCESS_TOKEN"]
  } else {
    Remove-Item Env:\SUPABASE_ACCESS_TOKEN -ErrorAction SilentlyContinue
    Write-Warning "Ignoring SUPABASE_ACCESS_TOKEN because it does not match the Supabase CLI token format. Falling back to existing supabase login."
  }
} else {
  Remove-Item Env:\SUPABASE_ACCESS_TOKEN -ErrorAction SilentlyContinue
}

if (-not $SkipFrontendEnv) {
  $frontendLines = @(
    "VITE_SUPABASE_URL=$supabaseUrl",
    "VITE_SUPABASE_PUBLISHABLE_KEY=$publishableKey",
    "VITE_TURNSTILE_SITE_KEY=$turnstileSiteKey"
  )
  Set-Content -LiteralPath $FrontendEnvPath -Value $frontendLines
  Write-Host "Wrote .env.local"
}

if (-not $SkipLink) {
  Write-Host "Linking Supabase project $projectRef..."
  Invoke-Checked "Supabase link" { npx supabase link --project-ref $projectRef --password $dbPassword --yes }
}

if (-not $SkipDbPush) {
  Write-Host "Pushing database migrations..."
  Invoke-Checked "Supabase db push" { npx supabase db push --password $dbPassword --yes }
}

if (-not $SkipSecrets) {
  $secretLines = @(
    "SUPABASE_URL=$supabaseUrl",
    "SUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey",
    "VISITOR_SIGNING_SECRET=$($envValues["VISITOR_SIGNING_SECRET"])",
    "VISITOR_HASH_SALT=$($envValues["VISITOR_HASH_SALT"])",
    "ABUSE_HASH_SALT=$($envValues["ABUSE_HASH_SALT"])",
    "TURNSTILE_SECRET_KEY=$turnstileSecret",
    "ADMIN_API_TOKEN=$($envValues["ADMIN_API_TOKEN"])",
    "PUBLIC_APP_ORIGIN=$publicOrigin",
    "RAW_EVENT_RETENTION_DAYS=$rawRetentionDays"
  )
  Set-Content -LiteralPath $GeneratedSecretsPath -Value $secretLines

  Write-Host "Setting Supabase Function secrets..."
  try {
    Invoke-Checked "Supabase secrets set" { npx supabase secrets set --project-ref $projectRef --env-file $GeneratedSecretsPath }
  } finally {
    if (Test-Path $GeneratedSecretsPath) {
      Remove-Item -LiteralPath $GeneratedSecretsPath -Force
    }
  }
}

if (-not $SkipFunctions) {
  $functions = @(
    "accept-consent",
    "get-deck",
    "record-swipe",
    "get-rankings",
    "create-share",
    "submit-contact",
    "admin-roster",
    "admin-freeze",
    "cleanup-retention"
  )

  Write-Host "Deploying Supabase Functions..."
  foreach ($functionName in $functions) {
    Write-Host "Deploying $functionName..."
    Invoke-Checked "Supabase functions deploy $functionName" {
      npx supabase functions deploy $functionName --project-ref $projectRef --use-api
    }
  }
}

Write-Host ""
Write-Host "Supabase wiring complete."
Write-Host "Frontend env: .env.local"
Write-Host "Function URL base: $supabaseUrl/functions/v1"
