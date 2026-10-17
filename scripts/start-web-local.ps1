param([switch]$Lan,[switch]$PrepareLanCertificateOnly,[int]$Port=0)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
if(-not (Test-Path -LiteralPath 'tmp/c136-browser-web/site/index.html')) { throw 'Execute npm run web:build antes de iniciar.' }
if(-not $Lan -and -not $PrepareLanCertificateOnly) { if($Port -eq 0){$Port=3001}; & node scripts/serve-web-local.mjs --port $Port; exit $LASTEXITCODE }
$certificateFolder=Join-Path $env:LOCALAPPDATA 'XandeflixPrebuilt\web-local'
New-Item -ItemType Directory -Path $certificateFolder -Force | Out-Null
$pfxPath=Join-Path $certificateFolder 'web-local.pfx'; $passwordPath=Join-Path $certificateFolder 'web-local-password.dpapi'; $publicPath=Join-Path $certificateFolder 'web-local.cer'
if(-not (Test-Path -LiteralPath $pfxPath)) {
  $addresses=Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -match '^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)' } | Select-Object -ExpandProperty IPAddress
  $san='2.5.29.17={text}DNS=localhost&DNS='+$env:COMPUTERNAME+'&IPAddress=127.0.0.1'
  foreach($address in $addresses){$san+='&IPAddress='+$address}
  $cert=New-SelfSignedCertificate -Type Custom -Subject 'CN=Xandeflix Web Local' -CertStoreLocation 'Cert:\CurrentUser\My' -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 -KeyExportPolicy Exportable -KeyUsage DigitalSignature,KeyEncipherment -TextExtension @($san,'2.5.29.37={text}1.3.6.1.5.5.7.3.1') -NotAfter (Get-Date).AddDays(90)
  $bytes=New-Object byte[] 32; $generator=[System.Security.Cryptography.RandomNumberGenerator]::Create(); $generator.GetBytes($bytes); $generator.Dispose()
  $secret=[Convert]::ToBase64String($bytes); $secure=ConvertTo-SecureString $secret -AsPlainText -Force
  Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $secure -CryptoAlgorithmOption AES256_SHA256 | Out-Null
  Export-Certificate -Cert $cert -FilePath $publicPath | Out-Null
  ConvertFrom-SecureString $secure | Set-Content -LiteralPath $passwordPath -Encoding UTF8
}
if(-not (Test-Path -LiteralPath $passwordPath) -or -not (Test-Path -LiteralPath $publicPath)){throw 'Certificado local incompleto. Nao recriar nem substituir automaticamente.'}
$publicCert=New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($publicPath)
Write-Output ('Certificado publico: '+$publicPath)
Write-Output ('Impressao digital: '+$publicCert.Thumbprint)
Write-Output ('Valido ate: '+$publicCert.NotAfter.ToString('yyyy-MM-dd'))
Write-Output 'Nenhuma raiz de confianca foi instalada. Os clientes LAN precisam confiar neste certificado publico.'
if($PrepareLanCertificateOnly){exit 0}
$securePassword=(Get-Content -LiteralPath $passwordPath -Raw).Trim() | ConvertTo-SecureString
$pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try { $env:XANDEFLIX_WEB_PFX_PASSWORD=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer); if($Port -eq 0){$Port=3443}; & node scripts/serve-web-local.mjs --host 0.0.0.0 --port $Port --pfx $pfxPath }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer); Remove-Item Env:\XANDEFLIX_WEB_PFX_PASSWORD -ErrorAction SilentlyContinue }
