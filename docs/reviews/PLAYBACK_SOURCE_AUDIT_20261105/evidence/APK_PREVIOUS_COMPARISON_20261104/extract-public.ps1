$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$auditRoot = 'C:\Xandeflix\Audits\APK_PREVIOUS_COMPARISON_20261104'
$targets = @(
  @{ Label = 'v137'; Path = 'C:\Users\Alexandre\Downloads\XANDEFLIX_RETORNO_EPISODIO_433a60d7 (1).apk'; Expected = '433a60d77669430de4cc09b45db0b3f29760b2578d920d76f60ee9580ce18252' },
  @{ Label = 'v152'; Path = 'C:\Xandeflix\Audits\DEVICE_AUDIT_20261104\candidate-20261103.apk'; Expected = '0146a2fc05d3e45f5670f4c5aba0fa0d0ba1cd25bd0086f7ac00de4cb6ab8c29' }
)
foreach ($target in $targets) {
  $actual = (Get-FileHash -LiteralPath $target.Path -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $target.Expected) { throw 'APK hash mismatch' }
  $outRoot = [IO.Path]::GetFullPath((Join-Path $auditRoot $target.Label))
  if (Test-Path -LiteralPath $outRoot) { throw 'Extraction target already exists' }
  [IO.Directory]::CreateDirectory($outRoot) | Out-Null
  $zip = [IO.Compression.ZipFile]::OpenRead($target.Path)
  $inventory = @()
  try {
    foreach ($entry in $zip.Entries) {
      if ($entry.FullName.EndsWith('/')) { continue }
      $stream = $entry.Open()
      $sha = [Security.Cryptography.SHA256]::Create()
      try { $hash = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLowerInvariant() }
      finally { $stream.Dispose(); $sha.Dispose() }
      $inventory += @{ Path = $entry.FullName; Bytes = $entry.Length; Sha256 = $hash }
      # Extract public shipped code assets only. Do not extract configuration or private data.
      if ($entry.FullName -notmatch '^assets/public/assets/[^/]+\.(js|css|map)$' -and $entry.FullName -ne 'assets/public/index.html') { continue }
      if ($entry.FullName.Contains('..') -or $entry.FullName.Contains('\') -or $entry.FullName.StartsWith('/')) { throw 'Unsafe ZIP path' }
      $unixType = (($entry.ExternalAttributes -shr 16) -band 0xF000)
      if ($unixType -eq 0xA000) { throw 'ZIP symlink rejected' }
      $dest = [IO.Path]::GetFullPath((Join-Path $outRoot $entry.FullName))
      if (-not $dest.StartsWith($outRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Extraction escaped root' }
      [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($dest)) | Out-Null
      [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest, $false)
    }
  } finally { $zip.Dispose() }
  $inventory | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $auditRoot ($target.Label + '-inventory.json')) -Encoding UTF8
  @{label=$target.Label; sha256=$actual; entries=$inventory.Count; js=@($inventory | Where-Object { $_.Path -match '^assets/public/assets/.+\.js$' } | ForEach-Object { @{Path=$_.Path;Bytes=$_.Bytes} })} | ConvertTo-Json -Depth 6
}
