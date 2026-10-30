(() => {
    window.menuCompactoZen?.encerrar();
    let menu = null;
    let origem = null;

    function fechar(devolverFoco = true) {
        menu?.remove();
        menu = null;
        origem?.setAttribute('aria-expanded', 'false');
        if (devolverFoco && origem?.isConnected) origem.focus();
    }

    function abrirPagina(url) {
        return chrome.tabs.create({windowId:window.vivaldiWindowId, url, active:true});
    }

    function selecionar(indice) {
        const itens = [...menu.querySelectorAll('[role="menuitem"]')];
        const selecionado = (indice + itens.length) % itens.length;
        itens.forEach((item, i) => { item.tabIndex = i === selecionado ? 0 : -1; });
        itens[selecionado].focus();
    }

    function teclado(evento) {
        const itens = [...menu.querySelectorAll('[role="menuitem"]')];
        const indice = itens.indexOf(document.activeElement);
        if (evento.key === 'Escape') {
            evento.preventDefault();
            evento.stopPropagation();
            fechar();
        } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(evento.key)) {
            evento.preventDefault();
            evento.stopPropagation();
            const destino = evento.key === 'Home' ? 0 : evento.key === 'End' ? itens.length - 1
                : indice + (evento.key === 'ArrowDown' ? 1 : -1);
            selecionar(destino);
        } else if (evento.key === 'Tab') fechar(false);
    }

    function alternar(botao, abrirCompleto) {
        if (menu?.isConnected) return fechar();
        origem = botao;
        const lateral = botao.closest('.tabbar-wrapper');
        if (!lateral) return abrirCompleto();
        menu = document.createElement('div');
        menu.id = 'zen-menu-compacto';
        menu.className = 'button-popup zen-menu-compacto';
        menu.setAttribute('role', 'menu');
        menu.setAttribute('aria-label', 'Menu do Vivaldi');
        const acoes = [
            {rotulo:'Nova aba', executar:() => chrome.tabs.create({windowId:window.vivaldiWindowId, active:true})},
            {rotulo:'Nova janela', executar:() => chrome.windows.create({})},
            null,
            {rotulo:'Histórico', executar:() => abrirPagina('vivaldi://history/')},
            {rotulo:'Downloads', executar:() => abrirPagina('vivaldi://downloads/')},
            {rotulo:'Favoritos', executar:() => abrirPagina('vivaldi://bookmarks/')},
            null,
            {rotulo:'Configurações', executar:() => abrirPagina('vivaldi://settings/')},
            {rotulo:'Menu completo', executar:abrirCompleto, completo:true}
        ];
        for (const acao of acoes) {
            const item = document.createElement(acao ? 'button' : 'div');
            if (!acao) item.setAttribute('role', 'separator');
            else {
                item.type = 'button';
                item.setAttribute('role', 'menuitem');
                item.tabIndex = -1;
                item.textContent = acao.rotulo;
                if (acao.completo) item.className = 'zen-menu-completo';
                item.addEventListener('click', async () => {
                    fechar(false);
                    try { await acao.executar(); }
                    catch (erro) { console.error('Não foi possível executar a opção do menu', erro); }
                });
            }
            menu.append(item);
        }
        menu.addEventListener('keydown', teclado);
        lateral.append(menu);
        botao.setAttribute('aria-expanded', 'true');
        botao.setAttribute('aria-controls', menu.id);
        selecionar(0);
    }

    function clicarFora(evento) {
        if (menu && !menu.contains(evento.target) && !origem?.contains(evento.target)) fechar(false);
    }

    function desfocar() { fechar(false); }
    function focarFora(evento) {
        if (menu && !menu.contains(evento.target) && !origem?.contains(evento.target)) fechar(false);
    }
    document.addEventListener('pointerdown', clicarFora, true);
    document.addEventListener('focusin', focarFora);
    window.addEventListener('blur', desfocar);
    window.menuCompactoZen = {
        alternar,
        fechar,
        encerrar() {
            fechar(false);
            document.removeEventListener('pointerdown', clicarFora, true);
            document.removeEventListener('focusin', focarFora);
            window.removeEventListener('blur', desfocar);
        }
    };
})();
