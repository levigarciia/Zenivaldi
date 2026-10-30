(() => {
    window.zeniPeek?.encerrar();
    let painel = null;
    let temporaria = null;
    let fonte = null;
    let geracao = 0;
    let mantendo = false;
    let pagina = null;

    async function fechar() {
        ++geracao;
        const aba = temporaria;
        temporaria = null;
        painel?.remove();
        painel = null;
        pagina = null;
        if (aba) await chrome.tabs.remove(aba).catch(() => {});
    }

    function botao(icone, rotulo, executar) {
        const elemento = document.createElement('button');
        elemento.type = 'button';
        elemento.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icone}</svg>`;
        elemento.title = rotulo;
        elemento.setAttribute('aria-label', rotulo);
        elemento.addEventListener('click', executar);
        return elemento;
    }

    async function promover(dividir = false) {
        if (!temporaria || mantendo) return;
        mantendo = true;
        try {
            const aba = await chrome.tabs.get(temporaria);
            const nova = await chrome.tabs.create({windowId:window.vivaldiWindowId, url:aba.url, active:true});
            if (dividir) {
                const origem = await chrome.tabs.get(fonte);
                const grupo = crypto.randomUUID();
                for (const [indice, item] of [origem, nova].entries()) {
                    const dados = JSON.parse(item.vivExtData || '{}');
                    dados.tiling = {id:grupo, index:indice, layout:'row', type:'selection'};
                    await chrome.tabs.update(item.id, {vivExtData:JSON.stringify(dados), highlighted:true});
                }
                await chrome.tabs.update(origem.id, {active:true});
            }
            await fechar();
        } finally { mantendo = false; }
    }

    async function abrir(url, abaFonte) {
        let endereco;
        try { endereco = new URL(url); } catch { return; }
        if (!['http:', 'https:'].includes(endereco.protocol)) return;
        await fechar();
        const atual = ++geracao;
        fonte = abaFonte;
        const container = document.querySelector('#webview-container');
        if (!container) return;
        const aba = await chrome.tabs.create({windowId:window.vivaldiWindowId, url:endereco.href, active:false,
            vivExtData:JSON.stringify({panelId:`ZENI_PEEK_${crypto.randomUUID()}`, zeniPeek:true})});
        if (atual !== geracao) { await chrome.tabs.remove(aba.id); return; }
        temporaria = aba.id;
        painel = document.createElement('div');
        painel.className = 'zeni-peek-fundo';
        const janela = document.createElement('section');
        janela.className = 'zeni-peek-janela';
        janela.tabIndex = -1;
        janela.setAttribute('role', 'dialog');
        janela.setAttribute('aria-label', 'ZeniPeek');
        const acoes = document.createElement('nav');
        acoes.className = 'zeni-peek-acoes';
        acoes.setAttribute('aria-label', 'Ações da prévia');
        janela.setAttribute('aria-label', `ZeniPeek: ${endereco.hostname}`);
        pagina = document.createElement('webview');
        pagina.tab_id = String(aba.id);
        pagina.setAttribute('tab_id', String(aba.id));
        pagina.setAttribute('parent_tab_id', '0');
        pagina.setAttribute('name', 'zeni-peek');
        pagina.className = 'zeni-peek-pagina';
        acoes.append(
            botao('<path d="m7 7 10 10M17 7 7 17"/>', 'Fechar prévia', () => fechar()),
            botao('<path d="M14 4h6v6M20 4l-7 7M4 14v6h6M4 20l7-7"/>',
                'Abrir como aba normal', () => promover().catch(console.error)),
            botao('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 4v16"/>',
                'Abrir lado a lado', () => promover(true).catch(console.error))
        );
        pagina.addEventListener('loadcommit', evento => {
            if (!evento.isTopLevel || !evento.url) return;
            try { janela.setAttribute('aria-label', `ZeniPeek: ${new URL(evento.url).hostname}`); } catch { return; }
        });
        pagina.addEventListener('newwindow', evento => {
            evento.preventDefault();
            const url = evento.targetUrl || evento.url;
            if (/^https?:\/\//i.test(url || '')) chrome.tabs.update(temporaria, {url});
        });
        janela.append(pagina, acoes);
        painel.append(janela);
        painel.addEventListener('pointerdown', evento => { if (evento.target === painel) fechar(); });
        container.append(painel);
        janela.focus();
    }

    function teclado(evento) {
        if (!painel) return;
        if (evento.key === 'Escape' || (evento.ctrlKey && evento.key.toLowerCase() === 'w')) {
            evento.preventDefault();
            evento.stopImmediatePropagation();
            fechar();
        }
    }

    function atalho(id, combinacao) {
        if (id !== window.vivaldiWindowId || !painel) return;
        if (['Esc', 'Escape'].includes(combinacao)) fechar();
    }

    const parar = window.zeniPaginas.observar((mensagem, remetente) => {
        if (mensagem.tipo === 'zeni-peek') abrir(mensagem.dados?.url, remetente.tab.id).catch(console.error);
        if (mensagem.tipo === 'zeni-peek-fechar' && remetente.tab.id === temporaria) fechar();
    });
    function remover(id) {
        if (id === temporaria) { temporaria = null; fechar(); }
        else if (id === fonte) fechar();
    }
    function ativar(info) {
        if (!mantendo && painel && info.windowId === window.vivaldiWindowId && info.tabId !== fonte) fechar();
    }
    chrome.tabs.onActivated.addListener(ativar);
    chrome.tabs.onRemoved.addListener(remover);
    document.addEventListener('keydown', teclado, true);
    vivaldi.tabsPrivate?.onKeyboardShortcut?.addListener(atalho);
    window.zeniPeek = {
        abrir, fechar, promover,
        encerrar() {
            parar();
            fechar();
            chrome.tabs.onActivated.removeListener(ativar);
            chrome.tabs.onRemoved.removeListener(remover);
            document.removeEventListener('keydown', teclado, true);
            vivaldi.tabsPrivate?.onKeyboardShortcut?.removeListener(atalho);
        }
    };
})();
