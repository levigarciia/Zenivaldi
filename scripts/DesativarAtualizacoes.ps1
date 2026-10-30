param([string]$RaizVivaldi = (Join-Path $env:LOCALAPPDATA 'Vivaldi'))
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Automacao.ps1')
Desativar-Atualizacao $RaizVivaldi
Write-Host 'Atualizações automáticas desativadas. O mod continua instalado.'
