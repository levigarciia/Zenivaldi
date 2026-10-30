(() => {
    let previa = false;
    if (window.__zeniPonte) return;
    const controle = new AbortController();
    const opcoes = {capture:true, signal:controle.signal};

    function enviar(tipo, dados) {
        chrome.runtime.sendMessage({tipo, dados}, () => { void chrome.runtime.lastError; });
    }

    function capturarLink(evento) {
        if (!evento.isTrusted || !evento.altKey || evento.button !== 0 || evento.ctrlKey || evento.metaKey) return;
        const link = evento.composedPath().find(item => item instanceof HTMLAnchorElement && item.href);
        if (!link || !/^https?:\/\//i.test(link.href) || link.hasAttribute('download')) return;
        evento.preventDefault();
        evento.stopImmediatePropagation();
        enviar('zeni-peek', {url:link.href});
    }

    document.addEventListener('click', capturarLink, opcoes);
    document.addEventListener('keydown', evento => {
        if (!previa || (evento.key !== 'Escape' && !(evento.ctrlKey && evento.key.toLowerCase() === 'w'))) return;
        evento.preventDefault();
        evento.stopImmediatePropagation();
        enviar('zeni-peek-fechar', null);
    }, opcoes);
    window.__zeniPonte = {
        definirPrevia(valor) { previa = !!valor; },
        encerrar() { controle.abort(); }
    };
    chrome.runtime.sendMessage({tipo:'zeni-contexto'}, resposta => {
        void chrome.runtime.lastError;
        previa = !!resposta?.previa;
    });
})();
