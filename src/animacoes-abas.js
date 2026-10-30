(() => {
    window.animacaoAbasZen?.encerrar();

    const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animacoes = new WeakMap();
    const emAndamento = new Set();
    const fantasmas = new Set();
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
                largura: retangulo.width,
                altura: retangulo.height,
                fixada: posicao.classList.contains('is-pinned')
            });
        }
        return resultado;
    }

    function animarDeslocamento(atual, anterior) {
        if (!anterior || atual.fixada || Math.abs(atual.esquerda - anterior.esquerda) > 1) return;
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

    function animarSaida(anterior) {
        if (anterior.esquerda + anterior.largura < 0 || anterior.esquerda > innerWidth
            || anterior.topo + anterior.altura < 0 || anterior.topo > innerHeight) return;
        const fantasma = document.createElement('div');
        fantasma.className = 'tab-position zeni-aba-saindo';
        fantasma.setAttribute('aria-hidden', 'true');
        const copia = anterior.elemento.cloneNode(true);
        for (const elemento of [copia, ...copia.querySelectorAll('*')]) {
            for (const atributo of ['id', 'role', 'data-id', 'aria-selected']) elemento.removeAttribute(atributo);
            elemento.setAttribute('tabindex', '-1');
        }
        fantasma.append(copia);
        Object.assign(fantasma.style, {
            position:'fixed', left:`${anterior.esquerda}px`, top:`${anterior.topo}px`,
            width:`${anterior.largura}px`, height:`${anterior.altura}px`, pointerEvents:'none', zIndex:70
        });
        document.querySelector('#browser').append(fantasma);
        fantasmas.add(fantasma);
        const animacao = fantasma.animate([
            {opacity:1, transform:'translateX(0) scale(1)'},
            {opacity:0, transform:'translateX(-12px) scale(.97)'}
        ], {duration:180, easing:'cubic-bezier(.2, .7, .25, 1)', fill:'forwards'});
        animacao.id = 'zeni-saida-aba';
        emAndamento.add(animacao);
        animacao.finished.catch(() => {}).finally(() => {
            fantasma.remove();
            fantasmas.delete(fantasma);
            emAndamento.delete(animacao);
        });
    }

    function atualizar() {
        quadro = null;
        if (encerrada) return;
        const atuais = listarAbas();
        const removidas = [...posicoes].filter(([id]) => !atuais.has(id));
        const houveRemocao = removidas.length > 0;
        if (houveRemocao && !movimentoReduzido.matches && !document.hidden) {
            for (const [, anterior] of removidas) animarSaida(anterior);
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
            for (const fantasma of fantasmas) fantasma.remove();
            posicoes.clear();
        }
    };
})();
