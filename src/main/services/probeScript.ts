const WINDOWS_PROBE_SCRIPT = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[void][Windows.Networking.Connectivity.NetworkInformation, Windows, ContentType = WindowsRuntime]

$start = [DateTimeOffset]::Parse($env:TM_START)
$end = [DateTimeOffset]::Parse($env:TM_END)

$states = New-Object Windows.Networking.Connectivity.NetworkUsageStates
$states.Roaming = [Windows.Networking.Connectivity.TriStates]::DoNotCare
$states.Shared = [Windows.Networking.Connectivity.TriStates]::DoNotCare

$resultType = [System.Collections.Generic.IReadOnlyList[Windows.Networking.Connectivity.AttributedNetworkUsage]]
$asTaskMethod = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetGenericArguments().Count -eq 1 -and $_.GetParameters().Count -eq 1
} | Select-Object -First 1
$asTaskClosed = $asTaskMethod.MakeGenericMethod($resultType)

$profiles = @()
$internet = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()
if ($internet -ne $null) { $profiles += $internet }
$extra = [Windows.Networking.Connectivity.NetworkInformation]::GetConnectionProfiles()
if ($extra -ne $null) { $profiles += $extra }

$unique = @{}
foreach ($profile in $profiles) {
  $id = ''
  try { $id = $profile.NetworkAdapter.NetworkAdapterId.ToString() } catch {}
  $key = "$($profile.ProfileName)|$id"
  if (-not $unique.ContainsKey($key)) {
    $unique[$key] = $profile
  }
}

$bucket = @{}
foreach ($profile in $unique.Values) {
  try {
    $op = $profile.GetAttributedNetworkUsageAsync($start, $end, $states)
    $rows = $asTaskClosed.Invoke($null, @($op)).GetAwaiter().GetResult()
    foreach ($row in $rows) {
      $raw = [string]$row.AttributionId
      if ([string]::IsNullOrWhiteSpace($raw)) { $raw = 'System/Unknown' }
      if (-not $bucket.ContainsKey($raw)) {
        $bucket[$raw] = [PSCustomObject]@{ attributionId = $raw; rxBytes = [int64]0; txBytes = [int64]0 }
      }
      $bucket[$raw].rxBytes += [int64]$row.BytesReceived
      $bucket[$raw].txBytes += [int64]$row.BytesSent
    }
  } catch {
    # ignore profile level failures to keep probe resilient
  }
}

$bucket.Values | ConvertTo-Json -Compress
`;

export function getWindowsProbeScript(): string {
  return WINDOWS_PROBE_SCRIPT;
}

