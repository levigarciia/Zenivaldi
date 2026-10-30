(() => {
    let previa = false;
    if (window.__zeniPonte) return;
    const controle = new AbortController();
    const opcoes = {capture:true, signal:controle.signal};
    let temporizador = null;
    let midiaAtual = null;
    let acoes = {};

    function enviar(tipo, dados) {
        chrome.runtime.sendMessage({tipo, dados}, () => { void chrome.runtime.lastError; });
    }

    function escolherMidia() {
        const candidatas = [...document.querySelectorAll('video, audio')]
            .filter(item => !item.ended && (item.duration >= 8 || item.duration === Infinity));
        return candidatas.find(item => !item.paused && !item.muted)
            || candidatas.find(item => !item.paused)
            || (midiaAtual?.isConnected && !midiaAtual.ended ? midiaAtual : null);
    }

    function flutuando() {
        return !!document.pictureInPictureElement || !!window.__zeniPip?.ativo();
    }

    function publicar() {
        enviar('zeni-pip', flutuando());
        midiaAtual = escolherMidia();
        clearTimeout(temporizador);
        if (!midiaAtual) return enviar('zeni-media', null);
        const metadados = navigator.mediaSession?.metadata;
        const capa = metadados?.artwork?.find(item => /^https?:|^data:image\//.test(item.src))?.src || '';
        enviar('zeni-media', {
            titulo:metadados?.title || document.title, artista:metadados?.artist || location.hostname,
            capa, tempo:midiaAtual.currentTime, duracao:Number.isFinite(midiaAtual.duration) ? midiaAtual.duration : 0,
            podeBuscar:midiaAtual.seekable.length > 0,
            pausado:midiaAtual.paused, mudo:midiaAtual.muted, volume:midiaAtual.volume,
            video:midiaAtual.tagName === 'VIDEO', anterior:!!acoes.anterior, proxima:!!acoes.proxima,
            pip:flutuando()
        });
        if (!midiaAtual.paused) temporizador = setTimeout(publicar, 1000);
    }

    function capturarLink(evento) {
        if (!evento.isTrusted || !evento.altKey || evento.button !== 0 || evento.ctrlKey || evento.metaKey) return;
        const link = evento.composedPath().find(item => item instanceof HTMLAnchorElement && item.href);
        if (!link || !/^https?:\/\//i.test(link.href) || link.hasAttribute('download')) return;
        evento.preventDefault();
        evento.stopImmediatePropagation();
        enviar('zeni-peek', {url:link.href});
    }

    async function executar(mensagem, remetente, responder) {
        if (remetente.id !== chrome.runtime.id || mensagem?.tipo !== 'zeni-comando') return;
        const item = escolherMidia();
        if (!item) { responder({erro:'Mídia indisponível'}); return; }
        try {
            switch (mensagem.acao) {
                case 'reproduzir': await item.play(); break;
                case 'pausar': item.pause(); break;
                case 'mudo': item.muted = !item.muted; break;
                case 'volume': item.volume = Math.max(0, Math.min(1, Number(mensagem.valor) || 0)); break;
                case 'buscar':
                    if (Number.isFinite(item.duration)) {
                        item.currentTime = Math.max(0, Math.min(item.duration, Number(mensagem.valor) || 0));
                    }
                    break;
                case 'anterior': case 'proxima':
                    window.dispatchEvent(new CustomEvent('zeni-media-trocar-faixa', {detail:mensagem.acao}));
                    break;
                case 'pip':
                    if (window.__zeniPip?.ativo()) window.__zeniPip.fechar();
                    else if (document.pictureInPictureElement) await document.exitPictureInPicture();
                    else if (window.__zeniPip && item instanceof HTMLVideoElement) await window.__zeniPip.abrir(item);
                    else await item.requestPictureInPicture();
                    break;
                default: return responder({erro:'Comando desconhecido'});
            }
            publicar();
            responder({ok:true});
        } catch (erro) { responder({erro:erro.message}); }
    }

    const receber = (mensagem, remetente, responder) => {
        if (mensagem?.tipo !== 'zeni-comando' || remetente.id !== chrome.runtime.id) return;
        void executar(mensagem, remetente, responder);
        return true;
    };
    document.addEventListener('click', capturarLink, opcoes);
    document.addEventListener('keydown', evento => {
        if (!previa || (evento.key !== 'Escape' && !(evento.ctrlKey && evento.key.toLowerCase() === 'w'))) return;
        evento.preventDefault();
        evento.stopImmediatePropagation();
        enviar('zeni-peek-fechar', null);
    }, opcoes);
    for (const evento of ['play', 'pause', 'ended', 'loadedmetadata', 'seeked', 'volumechange',
        'enterpictureinpicture', 'leavepictureinpicture']) {
        document.addEventListener(evento, publicar, opcoes);
    }
    window.addEventListener('zeni-media-acoes', evento => {
        try { acoes = JSON.parse(evento.detail); } catch { acoes = {}; }
    }, {signal:controle.signal});
    window.addEventListener('zeni-pip-mudou', publicar, {signal:controle.signal});
    window.dispatchEvent(new Event('zeni-media-pedir-acoes'));
    chrome.runtime.onMessage.addListener(receber);
    const observar = new MutationObserver(() => { if (midiaAtual && !midiaAtual.isConnected) publicar(); });
    observar.observe(document.documentElement, {childList:true, subtree:true});
    window.__zeniPonte = {
        definirPrevia(valor) { previa = !!valor; },
        publicar,
        encerrar() {
            controle.abort();
            clearTimeout(temporizador);
            observar.disconnect();
            chrome.runtime.onMessage.removeListener(receber);
        }
    };
    chrome.runtime.sendMessage({tipo:'zeni-contexto'}, resposta => {
        void chrome.runtime.lastError;
        previa = !!resposta?.previa;
    });
    publicar();
})();
