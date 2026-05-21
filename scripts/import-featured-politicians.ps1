param(
  [string]$SeedPath = "",
  [string]$EnvPath = "",
  [int]$LookupDelayMs = 1200,
  [switch]$SkipImageLookup,
  [switch]$ActivateLegacySeed
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($SeedPath)) {
  $SeedPath = Join-Path $Root "src\data\mockPoliticians.ts"
}
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

function Assert-SafeRosterText($Record) {
  $joined = @(
    $Record.display_name,
    $Record.role_label,
    $Record.party_label,
    $Record.search_query
  ) -join " "

  if ($joined -match "[<>]|javascript:") {
    throw "Roster text contains unsafe markup for $($Record.display_name)"
  }

  $royalPattern = "(monarchy|royal family|royal institution|privy council|\bking\b|\bqueen\b|สถาบันพระมหากษัตริย์|พระมหากษัตริย์|ราชวงศ์)"
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

function ConvertTo-UrlComponent($Value) {
  return [Uri]::EscapeDataString($Value).Replace("%20", "_")
}

function Convert-ThumbnailToCommonsFileUrl($ThumbnailUrl) {
  $parts = ([Uri]$ThumbnailUrl).AbsolutePath.Split("/", [System.StringSplitOptions]::RemoveEmptyEntries)
  if ($parts.Length -lt 2) {
    return $null
  }

  $fileName = $parts[$parts.Length - 2]
  if ([string]::IsNullOrWhiteSpace($fileName)) {
    return $null
  }

  return "https://commons.wikimedia.org/wiki/File:$fileName"
}

function Resolve-WikipediaSummaryImage($DisplayName) {
  $title = ConvertTo-UrlComponent $DisplayName
  $summaryUrl = "https://en.wikipedia.org/api/rest_v1/page/summary/$title"
  $summary = Invoke-RestMethod -Uri $summaryUrl -Headers @{ "User-Agent" = "SorsorRank roster import" } -TimeoutSec 30
  $pageUrl = $null
  $imageUrl = $null
  $imageSourceUrl = $null

  if ($summary.PSObject.Properties["content_urls"] -and $summary.content_urls.PSObject.Properties["desktop"]) {
    $desktopUrls = $summary.content_urls.desktop
    if ($desktopUrls.PSObject.Properties["page"]) {
      $pageUrl = $desktopUrls.page
    }
  }

  if ($summary.PSObject.Properties["thumbnail"] -and $summary.thumbnail.PSObject.Properties["source"]) {
    $imageUrl = $summary.thumbnail.source
    $imageSourceUrl = Convert-ThumbnailToCommonsFileUrl $imageUrl
  }

  if (-not $imageUrl -and -not $pageUrl) {
    return $null
  }

  return [pscustomobject]@{
    imageUrl = $imageUrl
    imageSourceUrl = if ($imageSourceUrl) { $imageSourceUrl } else { $pageUrl }
    infoSourceUrl = $pageUrl
    wikidataId = $null
  }
}

function Resolve-WikidataImage($DisplayName) {
  $searchUrl = "https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&limit=5&search=$([Uri]::EscapeDataString($DisplayName))"
  $search = Invoke-RestMethod -Uri $searchUrl -Headers @{ "User-Agent" = "SorsorRank roster import" } -TimeoutSec 30
  $candidate = $null

  foreach ($item in @($search.search)) {
    $label = Normalize-Text $item.label
    $description = Normalize-Text $item.description
    if ($label -eq $DisplayName -or ($description -and $description -match "Thai|Thailand|politician|minister|governor")) {
      $candidate = $item
      break
    }
  }

  if ($null -eq $candidate -and @($search.search).Count -gt 0) {
    $candidate = @($search.search)[0]
  }

  if ($null -eq $candidate) {
    return $null
  }

  $entityUrl = "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims%7Csitelinks&ids=$($candidate.id)"
  $entityResult = Invoke-RestMethod -Uri $entityUrl -Headers @{ "User-Agent" = "SorsorRank roster import" } -TimeoutSec 30
  $entity = $entityResult.entities.PSObject.Properties[$candidate.id].Value
  $fileName = $null

  if ($entity.claims.PSObject.Properties["P18"]) {
    $imageClaim = @($entity.claims.P18)[0]
    if ($imageClaim -and $imageClaim.mainsnak.PSObject.Properties["datavalue"]) {
      $fileName = $imageClaim.mainsnak.datavalue.value
    }
  }

  $sourceUrl = "https://www.wikidata.org/wiki/$($candidate.id)"
  if ($entity.sitelinks.PSObject.Properties["enwiki"]) {
    $enwiki = $entity.sitelinks.enwiki
    if ($enwiki.title) {
      $sourceUrl = "https://en.wikipedia.org/wiki/$(ConvertTo-UrlComponent $enwiki.title)"
    }
  }

  $imageUrl = $null
  $imageSourceUrl = $null
  if ($fileName) {
    $encodedFile = ConvertTo-UrlComponent $fileName
    $imageUrl = "https://commons.wikimedia.org/wiki/Special:FilePath/${encodedFile}?width=640"
    $imageSourceUrl = "https://commons.wikimedia.org/wiki/File:$encodedFile"
  }

  return [pscustomobject]@{
    imageUrl = $imageUrl
    imageSourceUrl = $imageSourceUrl
    infoSourceUrl = $sourceUrl
    wikidataId = $candidate.id
  }
}

function Read-SeedRows($Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Seed file not found: $Path"
  }

  $source = Get-Content -LiteralPath $Path -Raw
  $matches = [regex]::Matches($source, '\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]*)"\]')
  if ($matches.Count -eq 0) {
    throw "Could not parse seed rows from $Path"
  }

  $priority = 0
  foreach ($match in $matches) {
    $priority += 1
    [pscustomobject]@{
      slug = $match.Groups[1].Value
      displayName = $match.Groups[2].Value
      roleLabel = $match.Groups[3].Value
      partyLabel = $match.Groups[4].Value
      featuredPriority = $priority
    }
  }
}

function Resolve-FeaturedRole($Slug, $SeedRole) {
  switch ($Slug) {
    "anutin-charnvirakul" { return "Prime Minister" }
    "paetongtarn-shinawatra" { return "Former Prime Minister" }
    "srettha-thavisin" { return "Former Prime Minister" }
    "yingluck-shinawatra" { return "Former Prime Minister" }
    "abhisit-vejjajiva" { return "Former Prime Minister" }
    "thaksin-shinawatra" { return "Former Prime Minister" }
    "prayut-chan-o-cha" { return "Former Prime Minister" }
    default {
      if ($SeedRole -match "^Former ") {
        return Normalize-Text $SeedRole
      }
      return "Public political figure"
    }
  }
}

$envValues = Read-DotEnv $EnvPath
$projectRef = Require-Value $envValues "SUPABASE_PROJECT_REF"
$serviceRoleKey = Require-Value $envValues "SUPABASE_SERVICE_ROLE_KEY"
$supabaseUrl = if ($envValues.ContainsKey("SUPABASE_URL") -and -not [string]::IsNullOrWhiteSpace($envValues["SUPABASE_URL"])) {
  $envValues["SUPABASE_URL"].TrimEnd("/")
} else {
  "https://$projectRef.supabase.co"
}

$records = New-Object System.Collections.Generic.List[object]
$skipped = New-Object System.Collections.Generic.List[object]
$resolvedImages = 0
$legacySeedStatus = if ($ActivateLegacySeed) { "active" } else { "archived" }

foreach ($seed in Read-SeedRows $SeedPath) {
  $displayName = Normalize-Text $seed.displayName
  $roleLabel = Resolve-FeaturedRole $seed.slug $seed.roleLabel
  $partyLabel = $null
  $searchQuery = (@($displayName, "Thailand") | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }) -join " "
  $source = $null

  if (-not $SkipImageLookup) {
    try {
      $source = Resolve-WikipediaSummaryImage $displayName
      if (-not $source -or -not $source.imageUrl) {
        $source = Resolve-WikidataImage $displayName
      }
      if ($source -and $source.imageUrl) {
        $resolvedImages += 1
      }
    } catch {
      Write-Warning "Image lookup failed for ${displayName}: $($_.Exception.Message)"
    } finally {
      Start-Sleep -Milliseconds $LookupDelayMs
    }
  }

  $record = [ordered]@{
    slug = $seed.slug
    display_name = $displayName
    role_label = $roleLabel
    party_label = $partyLabel
    status = $legacySeedStatus
    search_query = $searchQuery
    featured_priority = if ($ActivateLegacySeed) { $seed.featuredPriority } else { $null }
    active_candidate = $false
    legal_reviewed_at = $null
    roster_version = 50
  }
  if ($source) {
    if ($source.imageUrl) {
      $record.image_url = $source.imageUrl
    }
    if ($source.imageSourceUrl) {
      $record.image_source_url = $source.imageSourceUrl
    }
    if ($source.infoSourceUrl) {
      $record.info_source_url = $source.infoSourceUrl
    }
  }

  try {
    Assert-SafeRosterText $record
    $records.Add([pscustomobject]$record)
  } catch {
    $skipped.Add([pscustomobject]@{ slug = $seed.slug; displayName = $displayName; reason = $_.Exception.Message })
  }
}

Write-Host "Prepared $($records.Count) featured rows from seed with status '$legacySeedStatus'. Images resolved for $resolvedImages rows."
if (-not $ActivateLegacySeed) {
  Write-Host "Legacy featured seed is archived by default so it does not replace the CSV-backed active roster."
}
if ($skipped.Count -gt 0) {
  Write-Warning "Skipped $($skipped.Count) rows that failed guardrails."
  $skipped | ConvertTo-Json -Depth 4
}

$politiciansUrl = "$supabaseUrl/rest/v1/politicians?on_conflict=slug"
$batchSize = 50
for ($offset = 0; $offset -lt $records.Count; $offset += $batchSize) {
  $remaining = $records.Count - $offset
  $take = [Math]::Min($batchSize, $remaining)
  $batch = @($records | Select-Object -Skip $offset -First $take)
  Invoke-SupabaseJson "Post" $politiciansUrl $serviceRoleKey $batch | Out-Null
  Write-Host "Upserted featured rows $($offset + 1)-$($offset + $take)."
}

$auditUrl = "$supabaseUrl/rest/v1/admin_audit_logs"
$auditPayload = @(
  [ordered]@{
    admin_id = "local-import"
    action = "featured_roster_import"
    target_type = "politicians"
    target_id = $null
    metadata = [ordered]@{
      source_file = [IO.Path]::GetFileName($SeedPath)
      total_seed_rows = $records.Count + $skipped.Count
      imported_rows = $records.Count
      skipped_rows = $skipped.Count
      image_rows = $resolvedImages
      roster_version = 50
      activated_legacy_seed = [bool]$ActivateLegacySeed
    }
  }
)
Invoke-SupabaseJson "Post" $auditUrl $serviceRoleKey $auditPayload | Out-Null

Write-Host "Imported featured roster into Supabase."
