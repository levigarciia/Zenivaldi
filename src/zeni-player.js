(() => {
    window.zeniPlayer?.encerrar();
    const fontes = new Map();
    const ocultas = new Set();
    const flutuantes = new Set();
    let escolhida = null;
    let painel = null;
    let elementos = {};
    let assinatura = '';
    const icones = {
        anterior: '<path d="M6 5v14M18 5 8 12l10 7z"/>',
        proxima: '<path d="M18 5v14M6 5l10 7-10 7z"/>',
        reproduzir: '<path d="m8 5 11 7-11 7z"/>',
        pausar: '<path d="M8 5v14M16 5v14"/>',
        som: '<path d="m11 5-6 4H2v6h3l6 4zM15 8q6 4 0 8M18 4q10 8 0 16"/>',
        mudo: '<path d="m11 5-6 4H2v6h3l6 4zM16 9l6 6M22 9l-6 6"/>',
        pip: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 12h7v5h-7z"/>',
        fechar: '<path d="m6 6 12 12M18 6 6 18"/>'
    };

    function definirIcone(elemento, nome) {
        if (elemento.dataset.icone === nome) return;
        elemento.dataset.icone = nome;
        elemento.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icones[nome]}</svg>`;
    }

    function tempo(valor) {
        const segundos = Math.max(0, Math.floor(valor || 0));
        return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
    }

    function criar(tag, classe, texto = '') {
        const elemento = document.createElement(tag);
        elemento.className = classe;
        elemento.textContent = texto;
        return elemento;
    }

    function botao(texto, rotulo, acao) {
        const elemento = criar('button', 'zeni-player-botao');
        definirIcone(elemento, texto);
        elemento.type = 'button';
        elemento.setAttribute('aria-label', rotulo);
        elemento.title = rotulo;
        elemento.addEventListener('click', acao);
        return elemento;
    }

    async function comandar(acao, valor) {
        const fonte = fontes.get(escolhida);
        if (!fonte) return;
        try {
            const resposta = await window.zeniPaginas.comando(fonte.abaId, fonte.frameId, acao, valor);
            if (resposta?.erro) throw new Error(resposta.erro);
            elementos.estado.textContent = '';
        } catch {
            elementos.estado.textContent = 'Este site não permitiu a ação. Abra a aba de origem para continuar.';
        }
    }

    function montar() {
        if (painel?.isConnected) return true;
        const barra = document.querySelector('#browser.tabs-left #tabs-container');
        if (!barra) return false;
        painel = criar('section', 'zeni-player');
        painel.setAttribute('aria-label', 'ZeniPlayer');
        const topo = criar('div', 'zeni-player-topo');
        const capa = criar('img', 'zeni-player-origem');
        capa.alt = '';
        capa.addEventListener('error', () => {
            capa.dataset.falha = capa.getAttribute('src');
            capa.hidden = true;
        });
        const dados = criar('div', 'zeni-player-dados');
        const abrirOrigem = async () => {
            const fonte = fontes.get(escolhida);
            if (fonte) await chrome.tabs.update(fonte.abaId, {active:true});
        };
        const titulo = criar('button', 'zeni-player-titulo');
        titulo.type = 'button';
        titulo.title = 'Abrir aba de origem';
        titulo.addEventListener('click', abrirOrigem);
        titulo.className = 'zeni-player-titulo';
        const artista = criar('span', 'zeni-player-artista');
        dados.append(titulo, artista);
        const pip = botao('pip', 'Vídeo em janela flutuante', () => comandar('pip'));
        topo.append(dados, pip, botao('fechar', 'Ocultar controles desta mídia', () => {
            ocultas.add(escolhida);
            escolhida = null;
            renderizar();
        }));
        const fontesSelect = criar('select', 'zeni-player-fontes');
        fontesSelect.setAttribute('aria-label', 'Fonte de reprodução');
        fontesSelect.addEventListener('change', () => { escolhida = fontesSelect.value; renderizar(); });
        const progresso = criar('input', 'zeni-player-progresso');
        progresso.type = 'range';
        progresso.min = 0;
        progresso.step = 0.1;
        progresso.setAttribute('aria-label', 'Posição da reprodução');
        progresso.addEventListener('change', () => comandar('buscar', progresso.value));
        const atual = criar('span', '', '0:00');
        const duracao = criar('span', '', '0:00');
        const controles = criar('div', 'zeni-player-controles');
        const origem = criar('button', 'zeni-player-site');
        origem.type = 'button';
        origem.title = 'Abrir aba de origem';
        origem.setAttribute('aria-label', 'Abrir aba de origem');
        origem.addEventListener('click', abrirOrigem);
        origem.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">'
            + '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/>'
            + '<path d="M3 12h18"/></svg>';
        origem.append(capa);
        const anterior = botao('anterior', 'Faixa anterior', () => comandar('anterior'));
        const reproduzir = botao('reproduzir', 'Reproduzir', () => {
            comandar(fontes.get(escolhida)?.pausado ? 'reproduzir' : 'pausar');
        });
        const proxima = botao('proxima', 'Próxima faixa', () => comandar('proxima'));
        const som = criar('div', 'zeni-player-som');
        const mudo = botao('som', 'Ativar ou desativar o som', () => comandar('mudo'));
        const volume = criar('input', 'zeni-player-volume');
        volume.type = 'range';
        volume.min = 0;
        volume.max = 1;
        volume.step = 0.05;
        volume.setAttribute('aria-label', 'Volume');
        volume.addEventListener('input', () => comandar('volume', volume.value));
        som.append(mudo, volume);
        controles.append(origem, anterior, reproduzir, proxima, som);
        const estado = criar('p', 'zeni-player-estado');
        estado.setAttribute('role', 'status');
        const linhaTempo = criar('div', 'zeni-player-linha-tempo');
        linhaTempo.append(atual, progresso, duracao);
        const detalhes = criar('div', 'zeni-player-detalhes');
        const conteudo = criar('div', 'zeni-player-conteudo');
        conteudo.append(topo, fontesSelect, linhaTempo);
        detalhes.append(conteudo);
        painel.append(detalhes, controles, estado);
        const depois = barra.querySelector(':scope > .toolbar-tabbar-after');
        barra.insertBefore(painel, depois);
        elementos = {capa, titulo, artista, fontesSelect, progresso, atual, duracao,
            anterior, reproduzir, proxima, mudo, volume, pip, estado};
        assinatura = '';
        return true;
    }

    function texto(elemento, valor) {
        if (elemento.textContent !== valor) elemento.textContent = valor;
    }

    function renderizar() {
        const candidatas = [...fontes.entries()].filter(([id]) => !ocultas.has(id));
        if (flutuantes.size) {
            painel?.remove();
            return;
        }
        if (!candidatas.length) { painel?.remove(); escolhida = null; return; }
        if (!candidatas.some(([id]) => id === escolhida)) {
            escolhida = candidatas.find(([, fonte]) => !fonte.pausado)?.[0] || candidatas[0][0];
        }
        if (!montar()) return;
        const fonte = fontes.get(escolhida);
        const novaAssinatura = JSON.stringify(candidatas.map(([id, item]) => [id, item.titulo]));
        if (novaAssinatura !== assinatura) {
            elementos.fontesSelect.replaceChildren(...candidatas.map(([id, item]) => {
                const opcao = document.createElement('option');
                opcao.value = id;
                opcao.textContent = item.titulo;
                return opcao;
            }));
            assinatura = novaAssinatura;
        }
        elementos.fontesSelect.hidden = candidatas.length < 2;
        elementos.fontesSelect.value = escolhida;
        texto(elementos.titulo, fonte.titulo);
        texto(elementos.artista, fonte.artista);
        elementos.capa.hidden = !fonte.icone || elementos.capa.dataset.falha === fonte.icone;
        if (fonte.icone && elementos.capa.getAttribute('src') !== fonte.icone) elementos.capa.src = fonte.icone;
        elementos.progresso.disabled = fonte.duracao <= 0 || !fonte.podeBuscar;
        elementos.progresso.max = Math.max(1, fonte.duracao);
        if (document.activeElement !== elementos.progresso) elementos.progresso.value = fonte.tempo;
        texto(elementos.atual, tempo(fonte.tempo));
        texto(elementos.duracao, fonte.duracao > 0 ? tempo(fonte.duracao) : 'Ao vivo');
        definirIcone(elementos.reproduzir, fonte.pausado ? 'reproduzir' : 'pausar');
        elementos.reproduzir.setAttribute('aria-label', fonte.pausado ? 'Reproduzir' : 'Pausar');
        elementos.reproduzir.title = fonte.pausado ? 'Reproduzir' : 'Pausar';
        elementos.anterior.disabled = !fonte.anterior;
        elementos.proxima.disabled = !fonte.proxima;
        definirIcone(elementos.mudo, fonte.mudo ? 'mudo' : 'som');
        if (document.activeElement !== elementos.volume) elementos.volume.value = fonte.volume;
        elementos.pip.hidden = !fonte.video;
    }

    const parar = window.zeniPaginas.observar((mensagem, remetente) => {
        const chave = `${remetente.tab.id}:${remetente.frameId}`;
        if (mensagem.tipo === 'zeni-pip') {
            if (mensagem.dados) flutuantes.add(chave);
            else flutuantes.delete(chave);
            renderizar();
            return;
        }
        if (mensagem.tipo !== 'zeni-media') return;
        const dados = mensagem.dados;
        if (!dados) fontes.delete(chave);
        else {
            const anterior = fontes.get(chave);
            if (anterior && (anterior.titulo !== dados.titulo || (anterior.pausado && !dados.pausado))) {
                ocultas.delete(chave);
            }
            fontes.set(chave, {...dados, titulo:String(dados.titulo || remetente.tab.title || 'Mídia').slice(0, 512),
                artista:String(dados.artista || '').slice(0, 512), icone:remetente.tab.favIconUrl || '',
                abaId:remetente.tab.id, frameId:remetente.frameId});
        }
        renderizar();
    });
    function remover(id) {
        for (const [chave, fonte] of fontes) if (fonte.abaId === id) fontes.delete(chave);
        for (const chave of ocultas) if (chave.startsWith(`${id}:`)) ocultas.delete(chave);
        for (const chave of flutuantes) if (chave.startsWith(`${id}:`)) flutuantes.delete(chave);
        renderizar();
    }
    function navegar(detalhes) {
        if (detalhes.frameId === 0) remover(detalhes.tabId);
        else {
            fontes.delete(`${detalhes.tabId}:${detalhes.frameId}`);
            flutuantes.delete(`${detalhes.tabId}:${detalhes.frameId}`);
            renderizar();
        }
    }
    const observar = new MutationObserver(() => { if (!painel?.isConnected && fontes.size) renderizar(); });
    observar.observe(document.documentElement, {childList:true, subtree:true});
    chrome.tabs.onRemoved.addListener(remover);
    chrome.webNavigation.onCommitted.addListener(navegar);
    window.zeniPlayer = {
        encerrar() {
            parar();
            observar.disconnect();
            chrome.tabs.onRemoved.removeListener(remover);
            chrome.webNavigation.onCommitted.removeListener(navegar);
            painel?.remove();
            fontes.clear();
            flutuantes.clear();
        }
    };
})();
