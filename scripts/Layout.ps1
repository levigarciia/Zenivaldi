function Ler-Preferencia($Objeto, [string]$Caminho) {
    $atual = $Objeto
    foreach ($parte in $Caminho.Split('.')) {
        if (-not $atual -or -not $atual.PSObject.Properties[$parte]) {
            return [pscustomobject]@{ existe = $false; valor = $null }
        }
        $atual = $atual.$parte
    }
    return [pscustomobject]@{ existe = $true; valor = $atual }
}

function Escrever-Preferencia($Objeto, [string]$Caminho, $Valor, [bool]$Existe = $true) {
    $partes = $Caminho.Split('.')
    $atual = $Objeto
    for ($indice = 0; $indice -lt $partes.Length - 1; $indice++) {
        $atual = Garantir-Objeto $atual $partes[$indice]
    }
    $nome = $partes[-1]
    if ($Existe) { Definir-Valor $atual $nome $Valor }
    else { $atual.PSObject.Properties.Remove($nome) }
}

function Configurar-Layout($Preferencias, $Estado, $Catalogo, [bool]$Remover) {
    $valores = [ordered]@{
        'vivaldi.tabs.bar.position' = 1
        'vivaldi.tabs.bar.width' = 265
        'vivaldi.auto_hide.enabled' = $true
        'vivaldi.auto_hide.tab_bar' = $true
        'vivaldi.auto_hide.address_bar' = $false
        'vivaldi.auto_hide.panel' = $false
        'vivaldi.auto_hide.status_bar' = $false
        'vivaldi.auto_hide.bookmarks_bar' = $false
        'vivaldi.auto_hide.show_introduction' = $false
        'vivaldi.toolbars.tabbar_before' = @('FlexibleSpacer', 'Back', 'Forward', 'Reload', 'AddressField', 'Extensions')
        'vivaldi.toolbars.tabbar_after' = @('DownloadButton', 'FlexibleSpacer', 'NewTab')
        'vivaldi.address_bar.extensions.show_all_toggle' = $true
        'vivaldi.address_bar.extensions.render_in_dropdown' = $true
        'vivaldi.quick_commands.open_url_in_new_tab' = $true
        'vivaldi.quick_commands.first_run_tip_dismissed' = $true
    }
    if ($Remover -and -not $Estado.PSObject.Properties['layout']) { return }
    if (-not $Estado.PSObject.Properties['layout']) {
        $anteriores = @()
        foreach ($caminho in $valores.Keys) {
            $anterior = Ler-Preferencia $Preferencias $caminho
            $anteriores += [pscustomobject]@{ caminho = $caminho; existe = $anterior.existe; valor = $anterior.valor }
        }
        Definir-Valor $Estado 'layout' ([pscustomobject]@{ valores = $anteriores; atalhos = @() })
    }
    $vivaldi = Garantir-Objeto $Preferencias 'vivaldi'
    if (-not $vivaldi.PSObject.Properties['actions']) {
        $padrao = $Catalogo.vivaldi.actions.default
        if (-not $padrao) { throw 'O catálogo de atalhos desta versão não foi encontrado.' }
        Definir-Valor $vivaldi 'actions' @($padrao | ConvertTo-Json -Depth 100 -Compress | ConvertFrom-Json)
    }
    if ($Remover) {
        foreach ($anterior in $Estado.layout.valores) {
            Escrever-Preferencia $Preferencias $anterior.caminho $anterior.valor $anterior.existe
        }
        foreach ($anterior in $Estado.layout.atalhos) {
            $comando = $vivaldi.actions[$anterior.indice].($anterior.comando)
            if (-not $comando) { continue }
            if ($anterior.existe) { Definir-Valor $comando 'shortcuts' @($anterior.valor) }
            else { $comando.PSObject.Properties.Remove('shortcuts') }
        }
        return
    }
    $pesquisa = $null
    for ($indice = 0; $indice -lt $vivaldi.actions.Count; $indice++) {
        foreach ($propriedade in $vivaldi.actions[$indice].PSObject.Properties) {
            $comando = $propriedade.Value
            $nome = $propriedade.Name
            $atalhos = @($comando.shortcuts)
            if ($nome -eq 'COMMAND_SHOW_QUICK_COMMANDS') { $pesquisa = $comando }
            if ($nome -ne 'COMMAND_SHOW_QUICK_COMMANDS' -and $atalhos -notcontains 'ctrl+t') { continue }
            $registrado = @($Estado.layout.atalhos | Where-Object { $_.indice -eq $indice -and $_.comando -eq $nome })
            if (-not $registrado.Count) {
                $Estado.layout.atalhos = @($Estado.layout.atalhos) + [pscustomobject]@{
                    indice = $indice; comando = $nome
                    existe = [bool]$comando.PSObject.Properties['shortcuts']; valor = $atalhos
                }
            }
            Definir-Valor $comando 'shortcuts' @($atalhos | Where-Object { $_ -and $_ -ne 'ctrl+t' })
        }
    }
    if (-not $pesquisa) { throw 'O comando de pesquisa rápida não foi encontrado no catálogo de atalhos.' }
    Definir-Valor $pesquisa 'shortcuts' @(@($pesquisa.shortcuts) + 'ctrl+t')
    foreach ($caminho in $valores.Keys) { Escrever-Preferencia $Preferencias $caminho $valores[$caminho] }
}
