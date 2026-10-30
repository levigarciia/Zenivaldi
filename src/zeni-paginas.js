(() => {
    window.zeniPaginas?.encerrar();
    const ouvintes = new Set();
    const injetadas = new Set();
    const navegando = new Set();
    let encerrada = false;

    async function preparar(aba, forcar = false) {
        if (encerrada || aba.windowId !== window.vivaldiWindowId || !/^https?:\/\//i.test(aba.url || '')) return;
        if (injetadas.has(aba.id) && !forcar) return;
        if (navegando.has(aba.id)) return;
        navegando.add(aba.id);
        try {
            let previa = false;
            try { previa = !!JSON.parse(aba.vivExtData || '{}').zeniPeek; } catch { previa = false; }
            await chrome.scripting.executeScript({target:{tabId:aba.id, allFrames:true},
                files:['user_files/zenivaldi/zeni-pagina-inicio.js']});
            await chrome.scripting.executeScript({target:{tabId:aba.id, allFrames:true},
                func:valor => { window.__zeniPonte?.definirPrevia(valor); window.__zeniPonte?.publicar(); }, args:[previa]});
            injetadas.add(aba.id);
        } catch { injetadas.delete(aba.id); }
        finally { navegando.delete(aba.id); }
    }

    function receber(mensagem, remetente, responder) {
        if (encerrada || remetente.id !== chrome.runtime.id || !remetente.tab) return;
        if (mensagem?.tipo !== 'zeni-pip' && remetente.tab.windowId !== window.vivaldiWindowId) return;
        if (mensagem?.tipo === 'zeni-contexto') {
            let previa = false;
            try { previa = !!JSON.parse(remetente.tab.vivExtData || '{}').zeniPeek; } catch { previa = false; }
            responder({previa});
            return;
        }
        if (!['zeni-peek', 'zeni-peek-fechar', 'zeni-media', 'zeni-pip'].includes(mensagem?.tipo)) return;
        for (const ouvinte of ouvintes) ouvinte(mensagem, remetente);
    }

    async function navegar(detalhes) {
        try { await preparar(await chrome.tabs.get(detalhes.tabId), true); } catch { return; }
    }

    async function atualizar(id, alteracao, aba) {
        if (alteracao.status === 'complete') await preparar(aba);
        if (alteracao.status === 'loading') injetadas.delete(id);
    }

    chrome.runtime.onMessage.addListener(receber);
    chrome.webNavigation.onDOMContentLoaded.addListener(navegar);
    chrome.tabs.onUpdated.addListener(atualizar);
    window.zeniPaginas = {
        observar(ouvinte) { ouvintes.add(ouvinte); return () => ouvintes.delete(ouvinte); },
        preparar,
        async comando(abaId, frameId, acao, valor) {
            return chrome.tabs.sendMessage(abaId, {tipo:'zeni-comando', acao, valor}, {frameId});
        },
        encerrar() {
            encerrada = true;
            chrome.runtime.onMessage.removeListener(receber);
            chrome.webNavigation.onDOMContentLoaded.removeListener(navegar);
            chrome.tabs.onUpdated.removeListener(atualizar);
            ouvintes.clear();
        }
    };
    async function iniciar() {
        try {
            const ids = ['zeni-midia-inicio', 'zeni-pagina-inicio'];
            const existentes = await chrome.scripting.getRegisteredContentScripts({ids});
            const faltantes = ids.filter(id => !existentes.some(item => item.id === id));
            if (faltantes.length) {
                await chrome.scripting.registerContentScripts(faltantes.map(id => ({
                    id, matches:['http://*/*', 'https://*/*'], allFrames:true,
                    world:id === 'zeni-midia-inicio' ? 'MAIN' : 'ISOLATED',
                    js:[`user_files/zenivaldi/${id}.js`], runAt:'document_start', persistAcrossSessions:false
                })));
            }
        } catch (erro) { console.warn('Os controles de faixa dependem do carregamento inicial da página.', erro); }
        const abas = await chrome.tabs.query({});
        for (const aba of abas) {
            if (aba.windowId === window.vivaldiWindowId) { preparar(aba); continue; }
            if (!/^https?:\/\//i.test(aba.url || '')) continue;
            chrome.scripting.executeScript({target:{tabId:aba.id, allFrames:true}, func:() => {
                chrome.runtime.sendMessage({tipo:'zeni-pip', dados:!!document.pictureInPictureElement},
                    () => { void chrome.runtime.lastError; });
            }}).catch(() => {});
        }
    }
    iniciar();
})();
