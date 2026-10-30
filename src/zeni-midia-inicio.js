(() => {
    if (window.__zeniAcoesMidia || !navigator.mediaSession) return;
    const sessao = navigator.mediaSession;
    const original = sessao.setActionHandler;
    const acoes = new Map();
    const publicar = () => window.dispatchEvent(new CustomEvent('zeni-media-acoes', {
        detail:JSON.stringify({anterior:acoes.has('previoustrack'), proxima:acoes.has('nexttrack')})
    }));
    const substituto = function(acao, manipulador) {
        const resultado = original.call(this, acao, manipulador);
        if (manipulador) acoes.set(acao, manipulador);
        else acoes.delete(acao);
        publicar();
        return resultado;
    };
    sessao.setActionHandler = substituto;
    window.addEventListener('zeni-media-pedir-acoes', publicar);
    window.addEventListener('zeni-media-trocar-faixa', evento => {
        const acao = evento.detail === 'anterior' ? 'previoustrack' : 'nexttrack';
        acoes.get(acao)?.({action:acao});
    });
    window.__zeniAcoesMidia = true;
})();
