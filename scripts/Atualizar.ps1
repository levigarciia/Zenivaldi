param(
    [string]$Configuracao = (Join-Path $env:LOCALAPPDATA 'Vivaldi\ZenivaldiAtualizador\configuracao.json'),
    [switch]$SomenteCache
)

$ErrorActionPreference = 'Stop'
$pasta = Split-Path $Configuracao -Parent
$bloqueio = $null

function Registrar-Resultado([string]$Mensagem) {
    $linha = "$(Get-Date -Format s): $Mensagem"
    [IO.File]::WriteAllText((Join-Path $pasta 'ultimo-resultado.txt'), $linha, (New-Object Text.UTF8Encoding $false))
    Write-Output $Mensagem
}

function Ocultar-JanelaDaTarefa([string]$NomeTarefa) {
    $tarefa = Get-ScheduledTask -TaskName $NomeTarefa -ErrorAction SilentlyContinue
    if (-not $tarefa) { return }
    $acao = $tarefa.Actions[0]
    if ($acao.Execute -ne 'powershell.exe') { return }
    $novaAcao = New-ScheduledTaskAction -Execute 'conhost.exe' -Argument "--headless powershell.exe $($acao.Arguments)"
    Set-ScheduledTask -TaskName $NomeTarefa -Action $novaAcao | Out-Null
}

try {
    $config = [IO.File]::ReadAllText($Configuracao) | ConvertFrom-Json
    if (-not $config.habilitada) { exit 0 }
    $nomeBloqueio = 'Local\' + $config.tarefa
    $bloqueio = New-Object Threading.Mutex($false, $nomeBloqueio)
    if (-not $bloqueio.WaitOne(0)) { $bloqueio.Dispose(); $bloqueio = $null; exit 0 }
    try { Ocultar-JanelaDaTarefa $config.tarefa } catch { }
    $raiz = [IO.Path]::GetFullPath($config.raiz).TrimEnd('\')
    $abertos = Get-Process vivaldi -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -and $_.Path.StartsWith($raiz + '\', [StringComparison]::OrdinalIgnoreCase)
    }
    if ($abertos) { Registrar-Resultado 'Vivaldi aberto. A atualização ficará para a próxima verificação.'; exit 0 }
    $pacote = $config.pacote
    $novaVersao = $config.versao
    $falhaRede = $null
    if (-not $SomenteCache) {
        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            $release = Invoke-RestMethod -Uri 'https://api.github.com/repos/levigarciia/Zenivaldi/releases/latest' `
                -Headers @{ 'User-Agent' = 'Zenivaldi'; Accept = 'application/vnd.github+json' } -TimeoutSec 30
            if ($release.tag_name -notmatch '^v(\d+\.\d+\.\d+)$') { throw 'Versão publicada não reconhecida.' }
            $publicada = $Matches[1]
            if ([version]$publicada -gt [version]$config.versao) {
                $asset = $release.assets | Where-Object { $_.name -eq 'Zenivaldi.zip' } | Select-Object -First 1
                $prefixo = 'https://github.com/levigarciia/Zenivaldi/releases/download/'
                if (-not $asset -or -not $asset.browser_download_url.StartsWith($prefixo)) { throw 'Pacote não reconhecido.' }
                if ($asset.digest -notmatch '^sha256:([a-f0-9]{64})$') { throw 'Pacote sem verificação de integridade.' }
                $esperado = $Matches[1]
                $temporario = Join-Path $pasta ([Guid]::NewGuid().ToString('N'))
                New-Item -ItemType Directory -Path $temporario | Out-Null
                $zip = Join-Path $temporario 'Zenivaldi.zip'
                Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zip -UseBasicParsing -TimeoutSec 120
                if ((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash -ne $esperado) {
                    throw 'O pacote baixado não passou pela verificação de integridade.'
                }
                Add-Type -AssemblyName System.IO.Compression.FileSystem
                $arquivo = [IO.Compression.ZipFile]::OpenRead($zip)
                $extracao = Join-Path $temporario 'extraido'
                try {
                    foreach ($entrada in $arquivo.Entries) {
                        $destino = [IO.Path]::GetFullPath((Join-Path $extracao $entrada.FullName))
                        if (-not $destino.StartsWith($extracao + '\', [StringComparison]::OrdinalIgnoreCase)) {
                            throw 'O pacote contém um caminho inválido.'
                        }
                        if (($entrada.ExternalAttributes -shr 16 -band 61440) -eq 40960) {
                            throw 'O pacote contém um link de arquivo não permitido.'
                        }
                    }
                } finally { $arquivo.Dispose() }
                Expand-Archive -LiteralPath $zip -DestinationPath $extracao
                $candidato = Join-Path $extracao 'Zenivaldi'
                $manifesto = [IO.File]::ReadAllText((Join-Path $candidato 'package.json')) | ConvertFrom-Json
                if ($manifesto.name -ne 'zenivaldi' -or $manifesto.version -ne $publicada) {
                    throw 'O conteúdo do pacote não corresponde à versão publicada.'
                }
                $pacote = $candidato
                $novaVersao = $publicada
            }
        } catch { $falhaRede = $_.Exception.Message }
    }
    $versaoVivaldi = Get-ChildItem -LiteralPath (Join-Path $raiz 'Application') -Directory |
        Where-Object { $_.Name -match '^\d+(\.\d+){3}$' } |
        Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
    if (-not $versaoVivaldi) { throw 'Instalação do Vivaldi não encontrada.' }
    $recursos = Join-Path $versaoVivaldi.FullName 'resources\vivaldi'
    $html = [IO.File]::ReadAllText((Join-Path $recursos 'window.html'))
    $reparar = -not $html.Contains('user_files/zenivaldi/pesquisa.js')
    $caminhoManifesto = Join-Path $pacote 'src\manifesto.json'
    if (Test-Path -LiteralPath $caminhoManifesto) {
        $manifesto = [IO.File]::ReadAllText($caminhoManifesto) | ConvertFrom-Json
    } else {
        $metadados = [IO.File]::ReadAllText((Join-Path $pacote 'package.json')) | ConvertFrom-Json
        if ($metadados.name -ne 'zenivaldi' -or [version]$metadados.version -ge [version]'0.2.0') {
            throw 'O pacote em cache está incompleto. Reinstale o Zenivaldi com o pacote oficial.'
        }
        $manifesto = [pscustomobject]@{
            scripts = @('animacoes-abas.js', 'autohide-barra.js', 'menu-compacto.js',
                'menu-barra.js', 'popups.js', 'pesquisa.js')
            recursos = @()
            css = @('zen.css')
        }
    }
    foreach ($nome in $manifesto.scripts) {
        if (-not (Test-Path -LiteralPath (Join-Path $recursos "user_files\zenivaldi\$nome")) -or
            -not $html.Contains("user_files/zenivaldi/$nome")) { $reparar = $true }
    }
    foreach ($nome in $manifesto.recursos) {
        if (-not (Test-Path -LiteralPath (Join-Path $recursos "user_files\zenivaldi\$nome"))) { $reparar = $true }
    }
    foreach ($nome in $manifesto.css) {
        if (-not (Test-Path -LiteralPath (Join-Path $raiz "Zenivaldi\$nome"))) { $reparar = $true }
    }
    if ($reparar -or $novaVersao -ne $config.versao) {
        $instalador = Join-Path $pacote 'scripts\Configurar.ps1'
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $instalador -RaizVivaldi $raiz `
            -Perfil $config.perfil -SemAtualizacaoAutomatica
        if ($LASTEXITCODE -ne 0) { throw 'A instalação não foi concluída. A configuração anterior do atualizador foi mantida.' }
        if ($novaVersao -ne $config.versao) {
            $cache = Join-Path (Join-Path $pasta 'pacotes') $novaVersao
            New-Item -ItemType Directory -Path $cache -Force | Out-Null
            foreach ($nome in @('src', 'scripts', 'package.json')) {
                Copy-Item -LiteralPath (Join-Path $pacote $nome) -Destination $cache -Recurse -Force
            }
            $config.pacote = $cache
            $config.versao = $novaVersao
            Copy-Item -LiteralPath (Join-Path $cache 'scripts\Atualizar.ps1') -Destination (Join-Path $pasta 'Atualizar.ps1') -Force
            [IO.File]::WriteAllText($Configuracao, ($config | ConvertTo-Json), (New-Object Text.UTF8Encoding $false))
        }
        Registrar-Resultado "Zenivaldi $novaVersao aplicado no Vivaldi $($versaoVivaldi.Name)."
    } elseif ($falhaRede) {
        Registrar-Resultado "Verificação remota indisponível. Versão local mantida: $falhaRede"
    } else { Registrar-Resultado "Zenivaldi $novaVersao já está atualizado." }
} catch {
    if (Test-Path -LiteralPath $pasta) { Registrar-Resultado "Não foi possível atualizar: $($_.Exception.Message)" }
    exit 1
} finally {
    if ($bloqueio) { $bloqueio.ReleaseMutex(); $bloqueio.Dispose() }
}
