$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$apk='C:\Xandeflix\Audits\DEVICE_AUDIT_20261104\fire-installed-before.apk'
$expected='f1eb668de79aebd0384424c67a289eea9c5206fa8db901020789f52a8a079358'
if((Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected){throw 'APK hash mismatch'}
$audit='C:\Xandeflix\Audits\CONNECTION_RECOVERY_20261104'
$out=[IO.Path]::GetFullPath((Join-Path $audit 'fire-usb-public'))
if(Test-Path -LiteralPath $out){throw 'Target exists'}
[IO.Directory]::CreateDirectory($out)|Out-Null
$zip=[IO.Compression.ZipFile]::OpenRead($apk)
$inv=@()
try{foreach($entry in $zip.Entries){if($entry.FullName.EndsWith('/')){continue}
 $s=$entry.Open();$sha=[Security.Cryptography.SHA256]::Create()
 try{$hash=[BitConverter]::ToString($sha.ComputeHash($s)).Replace('-','').ToLowerInvariant()}finally{$s.Dispose();$sha.Dispose()}
 $inv += @{Path=$entry.FullName;Bytes=$entry.Length;Sha256=$hash}
 if($entry.FullName -notmatch '^assets/public/assets/[^/]+\.(js|css|map)$' -and $entry.FullName -ne 'assets/public/index.html'){continue}
 if($entry.FullName.Contains('..') -or $entry.FullName.Contains('\') -or $entry.FullName.StartsWith('/') -or ((($entry.ExternalAttributes -shr 16) -band 0xF000) -eq 0xA000)){throw 'Unsafe entry'}
 $dest=[IO.Path]::GetFullPath((Join-Path $out $entry.FullName))
 if(-not $dest.StartsWith($out+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'Escaped root'}
 [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($dest))|Out-Null
 [IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$dest,$false)
}}finally{$zip.Dispose()}
$inv|ConvertTo-Json -Depth 5|Set-Content -LiteralPath (Join-Path $audit 'FIRE_USB_ZIP_INVENTORY.json') -Encoding UTF8
@{entries=$inv.Count;js=@($inv|Where-Object{$_.Path -match '^assets/public/assets/.+\.js$'}|ForEach-Object{@{Path=$_.Path;Bytes=$_.Bytes}})}|ConvertTo-Json -Depth 6
