(() => {
    window.animacaoAbasZen?.encerrar();

    const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animacoes = new WeakMap();
    const emAndamento = new Set();
    let posicoes = new Map();
    let quadro = null;
    let encerrada = false;

    function listarAbas() {
        const resultado = new Map();
        const seletor = '#browser.tabs-left:not(.is-settingspage) .tab-strip .tab-position';
        for (const posicao of document.querySelectorAll(seletor)) {
            const aba = posicao.querySelector('.tab-wrapper[role="tab"]');
            if (!aba?.id || !posicao.getClientRects().length) continue;
            const retangulo = posicao.getBoundingClientRect();
            resultado.set(aba.id, {
                elemento: aba,
                topo: retangulo.top,
                esquerda: retangulo.left,
                fixada: posicao.classList.contains('is-pinned')
            });
        }
        return resultado;
    }

    function animarDeslocamento(atual, anterior) {
        if (atual.fixada || Math.abs(atual.esquerda - anterior.esquerda) > 1) return;
        const elemento = atual.elemento;
        const existente = animacoes.get(elemento);
        const transformacao = getComputedStyle(elemento).transform;
        const deslocamentoAtual = existente && transformacao !== 'none'
            ? new DOMMatrixReadOnly(transformacao).m42
            : 0;
        const deslocamento = anterior.topo + deslocamentoAtual - atual.topo;
        if (Math.abs(deslocamento) < 0.5) return;

        existente?.cancel();
        const animacao = elemento.animate([
            { transform: `translateY(${deslocamento}px)` },
            { transform: 'translateY(0)' }
        ], { duration: 200, easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)' });
        animacao.id = 'zen-fechar-aba';
        animacoes.set(elemento, animacao);
        emAndamento.add(animacao);
        animacao.finished.catch(() => {}).finally(() => {
            emAndamento.delete(animacao);
            if (animacoes.get(elemento) === animacao) animacoes.delete(elemento);
        });
    }

    function atualizar() {
        quadro = null;
        if (encerrada) return;
        const atuais = listarAbas();
        const houveRemocao = atuais.size < posicoes.size
            && [...atuais.keys()].every(id => posicoes.has(id));
        if (houveRemocao && !movimentoReduzido.matches && !document.hidden) {
            for (const [id, atual] of atuais) animarDeslocamento(atual, posicoes.get(id));
        }
        posicoes = atuais;
    }

    function agendar() {
        if (quadro === null && !encerrada) quadro = requestAnimationFrame(atualizar);
    }

    const observador = new MutationObserver(agendar);
    observador.observe(document.documentElement, { childList: true, subtree: true });
    agendar();

    window.animacaoAbasZen = {
        encerrar() {
            encerrada = true;
            observador.disconnect();
            if (quadro !== null) cancelAnimationFrame(quadro);
            for (const animacao of emAndamento) animacao.cancel();
            posicoes.clear();
        }
    };
})();
