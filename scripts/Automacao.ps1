function Obter-PastaAtualizador([string]$Raiz) {
    return Join-Path $Raiz 'ZenivaldiAtualizador'
}

function Registrar-Atualizacao([string]$Raiz, [string]$Perfil, [string]$Pacote) {
    $pasta = Obter-PastaAtualizador $Raiz
    $versao = ([IO.File]::ReadAllText((Join-Path $Pacote 'package.json')) | ConvertFrom-Json).version
    $cache = Join-Path (Join-Path $pasta 'pacotes') $versao
    New-Item -ItemType Directory -Path $cache -Force | Out-Null
    foreach ($nome in @('src', 'scripts', 'package.json')) {
        $origem = Join-Path $Pacote $nome
        $destino = Join-Path $cache $nome
        if ([IO.Path]::GetFullPath($origem) -ne [IO.Path]::GetFullPath($destino)) {
            Copy-Item -LiteralPath $origem -Destination $cache -Recurse -Force
        }
    }
    Copy-Item -LiteralPath (Join-Path $cache 'scripts\Atualizar.ps1') -Destination (Join-Path $pasta 'Atualizar.ps1') -Force
    $sha = [Security.Cryptography.SHA256]::Create()
    try { $identificador = ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($Raiz)))).Replace('-', '').Substring(0, 12) }
    finally { $sha.Dispose() }
    $nomeTarefa = "ZenivaldiAtualizacao$identificador"
    $arquivo = Join-Path $pasta 'configuracao.json'
    $configuracao = [pscustomobject]@{
        raiz = $Raiz; perfil = $Perfil; versao = $versao; pacote = $cache
        tarefa = $nomeTarefa; habilitada = $true
    }
    [IO.File]::WriteAllText($arquivo, ($configuracao | ConvertTo-Json), (New-Object Text.UTF8Encoding $false))
    $argumentos = '--headless powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass ' +
        ('-File "{0}" -Configuracao "{1}"' -f (Join-Path $pasta 'Atualizar.ps1'), $arquivo)
    $acao = New-ScheduledTaskAction -Execute 'conhost.exe' -Argument $argumentos
    $gatilho = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Hours 1)
    $ajustes = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew `
        -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
    $usuario = [Security.Principal.WindowsIdentity]::GetCurrent().Name
    $principal = New-ScheduledTaskPrincipal -UserId $usuario -LogonType Interactive -RunLevel Limited
    Register-ScheduledTask -TaskName $nomeTarefa -Action $acao -Trigger $gatilho -Settings $ajustes `
        -Principal $principal -Description 'Atualiza o Zenivaldi e restaura o mod quando o Vivaldi estiver fechado.' `
        -Force | Out-Null
    return $arquivo
}

function Desativar-Atualizacao([string]$Raiz) {
    $arquivo = Join-Path (Obter-PastaAtualizador $Raiz) 'configuracao.json'
    if (-not (Test-Path -LiteralPath $arquivo)) { return }
    $configuracao = [IO.File]::ReadAllText($arquivo) | ConvertFrom-Json
    $configuracao.habilitada = $false
    [IO.File]::WriteAllText($arquivo, ($configuracao | ConvertTo-Json), (New-Object Text.UTF8Encoding $false))
    Unregister-ScheduledTask -TaskName $configuracao.tarefa -Confirm:$false -ErrorAction SilentlyContinue
}
