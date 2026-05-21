param(
  [Parameter(Mandatory = $true)]
  [string]$CsvPath,
  [string]$EnvPath = "",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($EnvPath)) {
  $EnvPath = Join-Path $Root ".env.supabase.local"
}

function Read-DotEnv($Path) {
  $values = @{}
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing env file: $Path"
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

function Require-Value($Values, $Key) {
  if (-not $Values.ContainsKey($Key) -or [string]::IsNullOrWhiteSpace($Values[$Key]) -or $Values[$Key] -like "YOUR_*") {
    throw "Missing $Key in $EnvPath"
  }

  return $Values[$Key]
}

function Normalize-Text($Value) {
  if ($null -eq $Value) {
    return $null
  }

  $text = ([string]$Value).Trim()
  $text = [regex]::Replace($text, "\s+", " ")
  if ($text.Length -eq 0) {
    return $null
  }

  return $text
}

function New-Slug($Parts) {
  $joined = ($Parts | ForEach-Object { Normalize-Text $_ }) -join "|"
  $bytes = [Text.Encoding]::UTF8.GetBytes($joined)
  $hash = [Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
  $hex = -join ($hash | ForEach-Object { $_.ToString("x2") })
  return "mp-27-$($hex.Substring(0, 12))"
}

function Assert-SafeRosterText($Record) {
  $joined = @(
    $Record.display_name,
    $Record.role_label,
    $Record.party_label,
    $Record.search_query
  ) -join " "

  if ($joined -match "[<>]") {
    throw "Roster text contains markup characters for $($Record.display_name)"
  }

  $royalPattern = "(monarchy|royal family|royal institution|\bking\b|\bqueen\b|สถาบันพระมหากษัตริย์|พระมหากษัตริย์|ราชวงศ์)"
  if ($joined -match $royalPattern) {
    throw "Roster text hit royal-institution guardrail for $($Record.display_name)"
  }
}

function Invoke-SupabaseJson($Method, $Url, $ServiceRoleKey, $Body) {
  $headers = @{
    apikey = $ServiceRoleKey
    Authorization = "Bearer $ServiceRoleKey"
    Prefer = "resolution=merge-duplicates,return=representation"
  }
  $json = $Body | ConvertTo-Json -Depth 10
  return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers -ContentType "application/json; charset=utf-8" -Body $json -TimeoutSec 60
}

if (-not (Test-Path -LiteralPath $CsvPath)) {
  throw "CSV not found: $CsvPath"
}

$envValues = Read-DotEnv $EnvPath
$projectRef = Require-Value $envValues "SUPABASE_PROJECT_REF"
$serviceRoleKey = Require-Value $envValues "SUPABASE_SERVICE_ROLE_KEY"
$supabaseUrl = if ($envValues.ContainsKey("SUPABASE_URL") -and -not [string]::IsNullOrWhiteSpace($envValues["SUPABASE_URL"])) {
  $envValues["SUPABASE_URL"].TrimEnd("/")
} else {
  "https://$projectRef.supabase.co"
}

$requiredHeaders = @("role", "prefix", "name", "party", "label", "province", "district_number", "list_number", "start_date", "end_date")
$rows = @(Import-Csv -LiteralPath $CsvPath)
if ($rows.Count -eq 0) {
  throw "CSV has no rows: $CsvPath"
}

$headers = @($rows[0].PSObject.Properties.Name)
foreach ($header in $requiredHeaders) {
  if ($headers -notcontains $header) {
    throw "CSV is missing required header: $header"
  }
}

$records = New-Object System.Collections.Generic.List[object]
$rowNumber = 0
foreach ($row in $rows) {
  $rowNumber += 1

  $prefix = Normalize-Text $row.prefix
  $name = Normalize-Text $row.name
  $role = Normalize-Text $row.role
  $party = Normalize-Text $row.party
  $label = Normalize-Text $row.label
  $province = Normalize-Text $row.province
  $districtNumber = Normalize-Text $row.district_number
  $listNumber = Normalize-Text $row.list_number
  $startDate = Normalize-Text $row.start_date
  $endDate = Normalize-Text $row.end_date

  if ([string]::IsNullOrWhiteSpace($name)) {
    throw "Row $rowNumber has an empty name."
  }

  $displayName = if ($prefix) { "$prefix $name" } else { $name }
  $roleParts = @($role, $label, $province)
  if ($districtNumber) {
    $roleParts += "#$districtNumber"
  }
  if ($listNumber) {
    $roleParts += "list #$listNumber"
  }
  $roleLabel = (($roleParts | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }) -join " - ")
  if ($roleLabel.Length -gt 120) {
    $roleLabel = $roleLabel.Substring(0, 120)
  }

  $searchQuery = (@($displayName, $role, $party, $province) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }) -join " "
  if ($searchQuery.Length -gt 240) {
    $searchQuery = $searchQuery.Substring(0, 240)
  }

  $record = [ordered]@{
    slug = New-Slug @($prefix, $name, $party, $label, $province, $districtNumber, $listNumber, $startDate)
    display_name = $displayName
    role_label = if ($roleLabel) { $roleLabel } else { $null }
    party_label = $party
    status = if ($endDate) { "archived" } else { "active" }
    search_query = $searchQuery
    active_candidate = $false
    legal_reviewed_at = $null
    roster_version = 27
  }

  Assert-SafeRosterText $record
  $records.Add([pscustomobject]$record)
}

$activeCount = @($records | Where-Object { $_.status -eq "active" }).Count
$archivedCount = @($records | Where-Object { $_.status -eq "archived" }).Count
Write-Host "Prepared $($records.Count) roster rows: $activeCount active, $archivedCount archived."

if ($DryRun) {
  $records | Select-Object -First 5 | ConvertTo-Json -Depth 5
  exit 0
}

$politiciansUrl = "$supabaseUrl/rest/v1/politicians?on_conflict=slug"
$batchSize = 100
for ($offset = 0; $offset -lt $records.Count; $offset += $batchSize) {
  $remaining = $records.Count - $offset
  $take = [Math]::Min($batchSize, $remaining)
  $batch = @($records | Select-Object -Skip $offset -First $take)
  Invoke-SupabaseJson "Post" $politiciansUrl $serviceRoleKey $batch | Out-Null
  Write-Host "Upserted rows $($offset + 1)-$($offset + $take)."
}

$auditUrl = "$supabaseUrl/rest/v1/admin_audit_logs"
$auditPayload = @(
  [ordered]@{
    admin_id = "local-import"
    action = "roster_csv_import"
    target_type = "politicians"
    target_id = $null
    metadata = [ordered]@{
      source_file = [IO.Path]::GetFileName($CsvPath)
      total_rows = $records.Count
      active_rows = $activeCount
      archived_rows = $archivedCount
      roster_version = 27
    }
  }
)
Invoke-SupabaseJson "Post" $auditUrl $serviceRoleKey $auditPayload | Out-Null

Write-Host "Imported CSV roster into Supabase."
