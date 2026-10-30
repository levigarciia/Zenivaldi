(() => {
    if (window.__zeniPip) return;
    let sessao = null;
    const estilos = `
:root { color-scheme: dark; font: 13px "Segoe UI", sans-serif; }
* { box-sizing: border-box; }
html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #000; }
.zeni-pip { position: relative; width: 100%; height: 100%; color: #eee; }
.zeni-pip-video { display: block; width: 100%; height: 100%; object-fit: contain; }
.zeni-pip::before {
    content: ""; position: absolute; inset: 0; background: #0008; pointer-events: none; transition: opacity 180ms ease;
}
.zeni-pip-topo, .zeni-pip-base { position: absolute; left: 0; right: 0; transition: opacity 180ms ease; }
.zeni-pip-topo { top: 0; display: flex; justify-content: space-between; padding: 8px; }
.zeni-pip-base { bottom: 0; padding: 0 24px 14px; }
.zeni-pip-linha { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; }
.zeni-pip-tempo { font-size: 13px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.zeni-pip-transporte, .zeni-pip-opcoes { display: flex; align-items: center; gap: 8px; }
.zeni-pip-opcoes { justify-self: end; }
.zeni-pip-botao {
    display: grid; place-items: center; width: 32px; height: 32px; padding: 6px; border: 0; border-radius: 6px;
    background: transparent; color: #eee; opacity: .85; cursor: pointer;
}
.zeni-pip-botao:hover, .zeni-pip-botao:focus-visible { opacity: 1; }
.zeni-pip-botao:focus-visible { outline: 1px solid #fff9; }
.zeni-pip-botao:disabled { opacity: .3; cursor: default; }
.zeni-pip-botao svg {
    width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.7;
    stroke-linecap: round; stroke-linejoin: round;
}
.zeni-pip-botao svg text { font: 600 8px "Segoe UI", sans-serif; fill: currentColor; stroke: none; }
.zeni-pip-botao svg .preenchido { fill: currentColor; stroke: none; }
.zeni-pip-botao[data-icone="pausar"] svg { stroke-width: 3; }
.zeni-pip-botao[data-icone="reproduzir"] svg { fill: currentColor; }
.zeni-pip input[type="range"] {
    appearance: none; height: 14px; min-width: 0; margin: 6px 0 0; padding: 0; border: 0;
    background: transparent; cursor: pointer;
}
.zeni-pip-progresso { width: 100%; --progresso: 0%; }
.zeni-pip input[type="range"]::-webkit-slider-runnable-track {
    height: 4px; border-radius: 4px;
    background: linear-gradient(to right, #eee var(--progresso), #ffffff50 var(--progresso));
}
.zeni-pip input[type="range"]::-webkit-slider-thumb {
    appearance: none; width: 10px; height: 10px; margin-top: -3px; border-radius: 50%; background: #fff; opacity: 0;
}
.zeni-pip input[type="range"]:is(:hover, :focus-visible)::-webkit-slider-thumb { opacity: 1; }
.zeni-pip input:disabled { opacity: .3; cursor: default; }
.zeni-pip-som { position: relative; }
.zeni-pip-volume { position: absolute; right: 0; bottom: 100%; width: 90px; visibility: hidden; }
.zeni-pip-som:is(:hover, :focus-within) .zeni-pip-volume { visibility: visible; }
.zeni-pip-estado { margin: 4px 0 0; font-size: 11px; }
.zeni-pip-estado:empty { display: none; }
.zeni-pip.inativo :is(.zeni-pip-topo, .zeni-pip-base), .zeni-pip.inativo::before { opacity: 0; pointer-events: none; }
@media (max-width: 400px) {
    .zeni-pip-base { padding: 0 12px 8px; }
    .zeni-pip-botao { width: 26px; height: 28px; padding: 4px; }
    .zeni-pip-transporte, .zeni-pip-opcoes { gap: 2px; }
    .zeni-pip-tempo { font-size: 11px; }
}
@media (prefers-reduced-motion: reduce) {
    .zeni-pip::before, .zeni-pip-topo, .zeni-pip-base { transition: none; }
}`;
    const icones = {
        voltar: '<path d="M20 12V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7"/>'
            + '<rect class="preenchido" x="7" y="8" width="6" height="5" rx="1"/><path d="m15 15 6 6M21 16v5h-5"/>',
        fechar: '<path d="m6 6 12 12M18 6 6 18"/>',
        reproduzir: '<path d="m8 5 10 7-10 7z"/>',
        pausar: '<path d="M8 5v14M16 5v14"/>',
        retroceder: '<path d="M11 4.1a8 8 0 1 1-6.9 4.4"/><path d="m13 1.6-2.4 2.5 2.4 2.5"/>'
            + '<text x="12" y="15" text-anchor="middle">5</text>',
        avancar: '<path d="M13 4.1a8 8 0 1 0 6.9 4.4"/><path d="m11 1.6 2.4 2.5-2.4 2.5"/>'
            + '<text x="12" y="15" text-anchor="middle">5</text>',
        som: '<path d="m11 5-6 4H2v6h3l6 4zM15 8q6 4 0 8M18 4q10 8 0 16"/>',
        mudo: '<path d="m11 5-6 4H2v6h3l6 4zM16 9l6 6M22 9l-6 6"/>',
        ampliar: '<path d="M14 4h6v6M20 4l-7 7M4 14v6h6M4 20l7-7"/>'
    };

    function icone(botao, nome) {
        if (botao.dataset.icone === nome) return;
        botao.dataset.icone = nome;
        botao.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icones[nome]}</svg>`;
    }

    function tempo(valor) {
        if (!Number.isFinite(valor)) return 'Ao vivo';
        const segundos = Math.max(0, Math.floor(valor));
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor(segundos / 60) % 60;
        const final = `${String(minutos).padStart(horas ? 2 : 1, '0')}:${String(segundos % 60).padStart(2, '0')}`;
        return horas ? `${horas}:${final}` : final;
    }

    function notificar() {
        window.dispatchEvent(new Event('zeni-pip-mudou'));
    }

    function fechar() {
        sessao?.janela.close();
    }

    function montar(janela, video, fluxo) {
        const documento = janela.document;
        const controle = new AbortController();
        let temporizador = null;
        let ampliado = false;
        const original = {largura:janela.innerWidth, altura:janela.innerHeight};
        const criar = (tag, classe) => {
            const elemento = documento.createElement(tag);
            elemento.className = classe;
            return elemento;
        };
        const executar = acao => () => {
            Promise.resolve().then(acao).catch(() => {
                estado.textContent = 'Não foi possível executar a ação.';
            });
        };
        const botao = (nome, rotulo, acao) => {
            const elemento = criar('button', 'zeni-pip-botao');
            elemento.type = 'button';
            elemento.title = rotulo;
            elemento.setAttribute('aria-label', rotulo);
            icone(elemento, nome);
            elemento.addEventListener('click', executar(acao), {signal:controle.signal});
            return elemento;
        };
        const tela = criar('main', 'zeni-pip');
        const imagem = criar('video', 'zeni-pip-video');
        imagem.muted = true;
        imagem.autoplay = true;
        imagem.srcObject = fluxo;
        const topo = criar('header', 'zeni-pip-topo');
        topo.append(botao('voltar', 'Voltar à aba', () => {
            chrome.runtime.sendMessage({tipo:'zeni-pip-origem'}, () => { void chrome.runtime.lastError; });
            window.focus();
            janela.close();
        }), botao('fechar', 'Fechar janela', () => janela.close()));
        const base = criar('section', 'zeni-pip-base');
        const linha = criar('div', 'zeni-pip-linha');
        const relogio = criar('span', 'zeni-pip-tempo');
        const transporte = criar('div', 'zeni-pip-transporte');
        const saltar = deslocamento => {
            if (video.seekable.length) {
                video.currentTime = Math.max(video.seekable.start(0),
                    Math.min(video.seekable.end(video.seekable.length - 1), video.currentTime + deslocamento));
            }
        };
        const reproduzir = botao('pausar', 'Pausar', () => video.paused ? video.play() : video.pause());
        const retroceder = botao('retroceder', 'Voltar cinco segundos', () => saltar(-5));
        const avancar = botao('avancar', 'Avançar cinco segundos', () => saltar(5));
        transporte.append(retroceder, reproduzir, avancar);
        const opcoes = criar('div', 'zeni-pip-opcoes');
        const som = criar('div', 'zeni-pip-som');
        const mudo = botao('som', 'Desativar som', () => { video.muted = !video.muted; });
        const volume = criar('input', 'zeni-pip-volume');
        volume.type = 'range';
        volume.min = 0;
        volume.max = 1;
        volume.step = 0.05;
        volume.setAttribute('aria-label', 'Volume');
        volume.addEventListener('input', () => { video.volume = Number(volume.value); }, {signal:controle.signal});
        som.append(mudo, volume);
        opcoes.append(som, botao('ampliar', 'Ampliar ou reduzir janela', () => {
            ampliado = !ampliado;
            janela.resizeTo(ampliado ? Math.round(janela.screen.availWidth * 0.8) : original.largura,
                ampliado ? Math.round(janela.screen.availHeight * 0.8) : original.altura);
        }));
        linha.append(relogio, transporte, opcoes);
        const progresso = criar('input', 'zeni-pip-progresso');
        progresso.type = 'range';
        progresso.min = 0;
        progresso.step = 0.1;
        progresso.setAttribute('aria-label', 'Posição da reprodução');
        progresso.addEventListener('input', () => {
            video.currentTime = Number(progresso.value);
        }, {signal:controle.signal});
        const estado = criar('p', 'zeni-pip-estado');
        estado.setAttribute('role', 'status');
        base.append(linha, progresso, estado);
        tela.append(imagem, topo, base);
        documento.body.replaceChildren(tela);

        function atualizar() {
            relogio.textContent = `${tempo(video.currentTime)} / ${tempo(video.duration)}`;
            progresso.disabled = !Number.isFinite(video.duration) || !video.seekable.length;
            progresso.max = Number.isFinite(video.duration) ? Math.max(1, video.duration) : 1;
            if (documento.activeElement !== progresso) progresso.value = video.currentTime;
            const porcentagem = Number.isFinite(video.duration) && video.duration > 0
                ? Math.min(100, video.currentTime / video.duration * 100) : 0;
            progresso.style.setProperty('--progresso', `${porcentagem}%`);
            retroceder.disabled = avancar.disabled = !video.seekable.length;
            icone(reproduzir, video.paused ? 'reproduzir' : 'pausar');
            reproduzir.title = video.paused ? 'Reproduzir' : 'Pausar';
            reproduzir.setAttribute('aria-label', reproduzir.title);
            icone(mudo, video.muted || !video.volume ? 'mudo' : 'som');
            mudo.title = video.muted ? 'Ativar som' : 'Desativar som';
            mudo.setAttribute('aria-label', mudo.title);
            if (documento.activeElement !== volume) volume.value = video.volume;
            tela.classList.toggle('pausado', video.paused);
            documento.title = document.title || 'ZeniPlayer';
        }

        function revelar() {
            tela.classList.remove('inativo');
            clearTimeout(temporizador);
            temporizador = setTimeout(() => {
                if (!video.paused && !tela.matches(':focus-within')) tela.classList.add('inativo');
            }, 1800);
        }

        function ocultar() {
            clearTimeout(temporizador);
            tela.classList.add('inativo');
        }

        for (const evento of ['timeupdate', 'play', 'pause', 'volumechange', 'durationchange', 'seeked']) {
            video.addEventListener(evento, atualizar, {signal:controle.signal});
        }
        for (const evento of ['pointermove', 'pointerdown', 'focusin']) {
            documento.addEventListener(evento, revelar, {signal:controle.signal});
        }
        documento.documentElement.addEventListener('pointerleave', ocultar, {signal:controle.signal});
        imagem.addEventListener('click', executar(() => video.paused ? video.play() : video.pause()),
            {signal:controle.signal});
        documento.addEventListener('keydown', evento => {
            if (evento.target instanceof janela.HTMLInputElement) return;
            if (evento.code === 'Space') { evento.preventDefault(); executar(() => video.paused
                ? video.play() : video.pause())(); }
            if (evento.key === 'ArrowLeft') { evento.preventDefault(); saltar(-5); }
            if (evento.key === 'ArrowRight') { evento.preventDefault(); saltar(5); }
            if (evento.key === 'Escape') janela.close();
            revelar();
        }, {signal:controle.signal});
        janela.addEventListener('pagehide', () => {
            controle.abort();
            clearTimeout(temporizador);
            for (const faixa of fluxo.getTracks()) faixa.stop();
            if (sessao?.janela === janela) sessao = null;
            notificar();
        }, {once:true});
        atualizar();
        ocultar();
        imagem.play().catch(() => {});
    }

    async function abrir(video) {
        if (!(video instanceof HTMLVideoElement)) throw new Error('Escolha um vídeo para abrir o PiP.');
        if (sessao?.video === video && !sessao.janela.closed) { fechar(); return; }
        if (!window.documentPictureInPicture || window.top !== window
            || typeof video.captureStream !== 'function') return video.requestPictureInPicture();
        let fluxo;
        let janela;
        try {
            fluxo = video.captureStream();
            janela = await documentPictureInPicture.requestWindow({
                width:600, height:338, disallowReturnToOpener:true
            });
            sessao = {janela, video};
            const estilo = janela.document.createElement('style');
            estilo.textContent = estilos;
            janela.document.head.append(estilo);
            montar(janela, video, fluxo);
            notificar();
            return janela;
        } catch (erro) {
            console.warn('PiP personalizado indisponível, usando o padrão.', erro);
            janela?.close();
            for (const faixa of fluxo?.getTracks() || []) faixa.stop();
            sessao = null;
            return video.requestPictureInPicture();
        }
    }

    document.addEventListener('click', evento => {
        if (!evento.isTrusted || evento.button !== 0) return;
        const botao = evento.composedPath().find(item => item.classList?.contains('vivaldi-picture-in-picture-button'));
        if (!botao) return;
        const video = [...document.querySelectorAll('video')].find(item => {
            const r = item.getBoundingClientRect();
            return evento.clientX >= r.left && evento.clientX <= r.right
                && evento.clientY >= r.top && evento.clientY <= r.bottom;
        });
        if (!video) return;
        evento.preventDefault();
        evento.stopImmediatePropagation();
        abrir(video).catch(console.error);
    }, true);
    function videoEmReproducao() {
        const videos = [...document.querySelectorAll('video')].filter(item => !item.ended && item.readyState > 1);
        return videos.find(item => !item.paused) || videos[0];
    }

    function abrirAutomatico() {
        const video = videoEmReproducao();
        if (video && !(sessao?.video === video && !sessao.janela.closed)) abrir(video).catch(console.error);
    }

    if (window.top === window && navigator.mediaSession) {
        try { navigator.mediaSession.setActionHandler('enterpictureinpicture', abrirAutomatico); } catch { }
    }
    window.addEventListener('pagehide', fechar);
    window.__zeniPip = {abrir, fechar, ativo:() => !!sessao && !sessao.janela.closed};
})();
