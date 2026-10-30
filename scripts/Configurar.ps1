param(
    [string]$RaizVivaldi = (Join-Path $env:LOCALAPPDATA 'Vivaldi'),
    [string]$Perfil = 'Default',
    [switch]$Remover,
    [switch]$SemAtualizacaoAutomatica
)

$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding $false

function Gravar-Texto([string]$Caminho, [string]$Texto) {
    [IO.File]::WriteAllText($Caminho, $Texto, $utf8)
}

function Garantir-Objeto($Objeto, [string]$Nome) {
    if (-not $Objeto.PSObject.Properties[$Nome]) {
        $Objeto | Add-Member -NotePropertyName $Nome -NotePropertyValue ([pscustomobject]@{})
    }
    return $Objeto.$Nome
}

function Definir-Valor($Objeto, [string]$Nome, $Valor) {
    $Objeto | Add-Member -NotePropertyName $Nome -NotePropertyValue $Valor -Force
}

try {
    if ($Perfil -match '[\\/]' -or $Perfil -in @('.', '..')) { throw 'Nome de perfil inválido.' }
    $raiz = [IO.Path]::GetFullPath($RaizVivaldi).TrimEnd('\')
    $abertos = Get-Process vivaldi -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -and $_.Path.StartsWith($raiz + '\', [StringComparison]::OrdinalIgnoreCase)
    }
    if ($abertos) { throw 'Feche todas as janelas do Vivaldi e execute este arquivo novamente.' }
    $aplicacao = Join-Path $raiz 'Application'
    $versao = Get-ChildItem -LiteralPath $aplicacao -Directory |
        Where-Object { $_.Name -match '^\d+(\.\d+){3}$' } |
        Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
    if (-not $versao) { throw 'Vivaldi não encontrado. Consulte a seção de instalação do README.' }
    $recursos = Join-Path $versao.FullName 'resources\vivaldi'
    $janela = Join-Path $recursos 'window.html'
    $dados = Join-Path $raiz 'User Data'
    $preferencias = Join-Path (Join-Path $dados $Perfil) 'Preferences'
    $estadoLocal = Join-Path $dados 'Local State'
    foreach ($arquivo in @($janela, $preferencias, $estadoLocal)) {
        if (-not (Test-Path -LiteralPath $arquivo)) { throw "Arquivo não encontrado: $arquivo" }
    }
    $html = [IO.File]::ReadAllText($janela)
    if (-not $html.Contains('</head>')) { throw 'Esta versão do Vivaldi usa uma estrutura não reconhecida.' }
    $prefs = [IO.File]::ReadAllText($preferencias) | ConvertFrom-Json
    $local = [IO.File]::ReadAllText($estadoLocal) | ConvertFrom-Json
    $aparencia = Garantir-Objeto (Garantir-Objeto $prefs 'vivaldi') 'appearance'
    $browser = Garantir-Objeto $local 'browser'
    $pastaMod = Join-Path $raiz 'Zenivaldi'
    $estadoMod = Join-Path $pastaMod 'estado.json'
    $origem = Join-Path (Split-Path $PSScriptRoot -Parent) 'src'
    $scripts = @('animacoes-abas.js', 'autohide-barra.js', 'menu-barra.js', 'popups.js', 'pesquisa.js')
    if ($Remover -and -not (Test-Path -LiteralPath $estadoMod)) {
        throw 'Não há uma instalação do Zenivaldi feita por este instalador.'
    }
    if (-not $Remover) {
        foreach ($nome in @('zen.css') + $scripts) {
            if (-not (Test-Path -LiteralPath (Join-Path $origem $nome))) { throw "Arquivo do mod ausente: $nome" }
        }
    }
    $backup = Join-Path (Join-Path $raiz 'ZenivaldiBackups') (Get-Date -Format 'yyyyMMddHHmmssfff')
    New-Item -ItemType Directory -Path $backup -Force | Out-Null
    Copy-Item -LiteralPath $janela -Destination (Join-Path $backup 'window.html')
    Copy-Item -LiteralPath $preferencias -Destination (Join-Path $backup 'Preferences')
    Copy-Item -LiteralPath $estadoLocal -Destination (Join-Path $backup 'Local State')
    New-Item -ItemType Directory -Path $pastaMod -Force | Out-Null
    if (Test-Path -LiteralPath $estadoMod) {
        $anterior = [IO.File]::ReadAllText($estadoMod) | ConvertFrom-Json
    } else {
        $anterior = [pscustomobject]@{
            perfil = $Perfil
            pastaCss = $aparencia.css_ui_mods_directory
            experimentosCss = @($browser.enabled_labs_experiments | Where-Object { $_ -like 'vivaldi-css-mods@*' })
        }
    }
    if ($anterior.perfil -ne $Perfil) { throw 'Este instalador já foi usado em outro perfil desta instalação.' }
    $experimentos = @($browser.enabled_labs_experiments | Where-Object { $_ -and $_ -notlike 'vivaldi-css-mods@*' })
    if ($Remover) {
        Definir-Valor $aparencia 'css_ui_mods_directory' $anterior.pastaCss
        Definir-Valor $browser 'enabled_labs_experiments' @($experimentos + $anterior.experimentosCss)
    } else {
        Gravar-Texto $estadoMod ($anterior | ConvertTo-Json -Depth 10)
        Copy-Item -LiteralPath (Join-Path $origem 'zen.css') -Destination (Join-Path $pastaMod 'zen.css') -Force
        Definir-Valor $aparencia 'css_ui_mods_directory' $pastaMod
        Definir-Valor $browser 'enabled_labs_experiments' @($experimentos + 'vivaldi-css-mods@1')
    }
    foreach ($nome in $scripts) {
        $referencia = "user_files/zenivaldi/$nome"
        $padrao = '(?m)^\s*<script src="' + [regex]::Escape($referencia) + '" defer></script>\r?\n?'
        $html = [regex]::Replace($html, $padrao, '')
        if (-not $Remover) {
            $destino = Join-Path $recursos 'user_files\zenivaldi'
            New-Item -ItemType Directory -Path $destino -Force | Out-Null
            Copy-Item -LiteralPath (Join-Path $origem $nome) -Destination (Join-Path $destino $nome) -Force
            $html = $html.Replace('</head>', "  <script src=`"$referencia`" defer></script>`n</head>")
        }
    }
    Gravar-Texto $preferencias ($prefs | ConvertTo-Json -Depth 100 -Compress)
    Gravar-Texto $estadoLocal ($local | ConvertTo-Json -Depth 100 -Compress)
    Gravar-Texto $janela $html
    if (-not $SemAtualizacaoAutomatica) {
        . (Join-Path $PSScriptRoot 'Automacao.ps1')
        if ($Remover) { Desativar-Atualizacao $raiz }
        else {
            try {
                $configuracao = Registrar-Atualizacao $raiz $Perfil (Split-Path $PSScriptRoot -Parent)
                Write-Host 'Atualizações automáticas ativadas. A verificação acontece a cada hora, com o Vivaldi fechado.'
            } catch { Write-Warning "Mod instalado, mas a atualização automática não foi ativada: $($_.Exception.Message)" }
        }
    }
    if ($Remover) { Write-Host 'Zenivaldi desativado. Abra o Vivaldi.' }
    else { Write-Host "Zenivaldi instalado no Vivaldi $($versao.Name). Abra o navegador e consulte o README." }
    Write-Host "Backup salvo em: $backup"
} catch {
    Write-Host "Não foi possível concluir: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
