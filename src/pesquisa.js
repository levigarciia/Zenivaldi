function obterEnderecoDireto(consulta) {
    const texto = consulta.trim();
    if (!texto || /\s/.test(texto)) return null;
    const comProtocolo = /^https?:\/\//i.test(texto);
    try {
        const endereco = new URL(comProtocolo ? texto : `https://${texto}`);
        if (!['http:', 'https:'].includes(endereco.protocol)) return null;
        const dominio = endereco.hostname;
        const pareceDominio = dominio === 'localhost'
            || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(dominio)
            || /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9-]{2,}$/i.test(dominio);
        if (!comProtocolo && !pareceDominio) return null;
        return endereco.href;
    } catch {
        return null;
    }
}

function ordenarSugestoesZen(historico, consulta) {
    const termo = consulta.trim().toLocaleLowerCase();
    const unicos = new Map();
    for (const item of historico) {
        let url;
        try { url = new URL(item.url); } catch { continue; }
        if (!['http:', 'https:'].includes(url.protocol)) continue;
        url.hash = '';
        const partes = url.pathname.split('/').filter(Boolean);
        const dominio = url.hostname.replace(/^www\./, '');
        const raiz = partes.length === 0 && !url.search;
        const postagem = /^\/(p|reel|reels|status|posts|watch|shorts)\//i.test(url.pathname);
        const pontos = (raiz ? 1000 : 0) - partes.length * 30 - (postagem ? 200 : 0)
            - (url.search ? 40 : 0) + Math.min(item.visitCount || 0, 20);
        const chave = `${dominio}${url.pathname.replace(/\/$/, '')}${url.search}`;
        const candidato = {url:url.href, titulo:item.title || dominio, pontos};
        if (!unicos.has(chave) || unicos.get(chave).pontos < pontos) unicos.set(chave, candidato);
        if (dominio.includes(termo.replace(/^https?:\/\//, '').replace(/\/$/, ''))) {
            const chaveRaiz = dominio;
            if (!unicos.has(chaveRaiz)) {
                unicos.set(chaveRaiz, {url:url.origin + '/', titulo:dominio, pontos:1000});
            }
        }
    }
    return [...unicos.values()].sort((a,b)=>b.pontos-a.pontos || a.url.localeCompare(b.url)).slice(0,8);
}

(() => {
    window.pesquisaZen?.encerrar();
    let lista = null;
    let recipiente = null;
    let resultados = [];
    let selecionado = 0;
    let geracao = 0;
    let temporizador = null;
    let campoAtual = null;
    let abrindoResultado = false;

    function obterConsulta(campo) {
        const inicio = campo.selectionStart;
        const fim = campo.selectionEnd;
        const completando = inicio !== null && inicio > 0 && inicio < fim && fim === campo.value.length;
        return (completando ? campo.value.slice(0, inicio) : campo.value).trim();
    }

    function sugestaoGoogle(consulta) {
        return {
            url:`https://www.google.com/search?q=${encodeURIComponent(consulta)}`,
            titulo:`Pesquisar por “${consulta}” com Google`,
            pesquisa:true
        };
    }

    function sugestoesImediatas(consulta) {
        if (!consulta) return [];
        const sugestoes = [sugestaoGoogle(consulta)];
        const endereco = obterEnderecoDireto(consulta);
        if (endereco) sugestoes.push({url:endereco, titulo:'Abrir endereço', direto:true});
        return sugestoes;
    }

    function limpar() {
        lista?.remove();
        recipiente?.classList.remove('pesquisa-zen-ativa');
        lista = null;
        resultados = [];
    }

    function selecionar(indice) {
        selecionado = (indice + resultados.length) % resultados.length;
        [...lista.children].forEach((linha, i) => linha.setAttribute('aria-selected', String(i === selecionado)));
        lista.children[selecionado]?.scrollIntoView({block:'nearest'});
    }

    async function abrir(indice) {
        const resultado = resultados[indice];
        if (!resultado || abrindoResultado) return;
        abrindoResultado = true;
        ++geracao;
        clearTimeout(temporizador);
        try {
            await fecharModal(campoAtual);
            if (resultado.abaId !== undefined) {
                await chrome.tabs.update(resultado.abaId, {active:true});
            } else {
                await chrome.tabs.create({url:resultado.url, active:true});
            }
            limpar();
        } catch (erro) {
            console.error('Não foi possível abrir o resultado da pesquisa', erro);
        } finally {
            abrindoResultado = false;
        }
    }

    async function aguardar(condicao) {
        const limite = Date.now() + 1500;
        while (!condicao()) {
            if (Date.now() > limite) throw new Error('O modal de pesquisa não confirmou o fechamento');
            await new Promise(resolve => setTimeout(resolve, 20));
        }
    }

    async function fecharModal(campo) {
        if (!campo?.isConnected) return;
        const escapar = () => campo.dispatchEvent(new KeyboardEvent('keydown', {
            key:'Escape', code:'Escape', keyCode:27, bubbles:true
        }));
        escapar();
        await aguardar(() => !campo.isConnected || campo.value === '');
        if (!campo.isConnected) return;
        escapar();
        await aguardar(() => !campo.isConnected);
    }

    function apresentar(campo, sugestoes) {
        lista?.remove();
        recipiente = campo.closest('.quick-command-container');
        if (!recipiente) return;
        resultados = sugestoes;
        lista = document.createElement('div');
        lista.className = 'pesquisa-zen-lista';
        lista.setAttribute('role', 'listbox');
        lista.setAttribute('aria-label', 'Sugestões de endereços');
        for (const [indice, item] of resultados.entries()) {
            const linha = document.createElement('div');
            linha.className = 'pesquisa-zen-linha';
            if (item.pesquisa) linha.classList.add('pesquisa-zen-google');
            linha.setAttribute('role', 'option');
            const icone = document.createElement('img');
            icone.width = icone.height = 16;
            icone.alt = '';
            icone.src = `chrome://favicon2/?size=16&scaleFactor=1x&pageUrl=${encodeURIComponent(item.url)}`;
            const titulo = document.createElement('strong');
            titulo.textContent = item.titulo;
            const endereco = document.createElement('span');
            endereco.textContent = item.pesquisa ? '' : new URL(item.url).href.replace(/^https?:\/\/(www\.)?/, '');
            linha.append(icone, titulo, endereco);
            linha.addEventListener('pointerdown', evento => {evento.preventDefault(); abrir(indice);});
            lista.append(linha);
        }
        recipiente.append(lista);
        recipiente.classList.add('pesquisa-zen-ativa');
        if (resultados.length) {
            const primeiroSite = resultados.findIndex(item => !item.pesquisa);
            selecionar(primeiroSite < 0 ? 0 : primeiroSite);
        }
    }

    async function pesquisar(campo) {
        const atual = ++geracao;
        const consulta = obterConsulta(campo);
        const pesquisa = sugestoesImediatas(consulta);
        apresentar(campo, pesquisa);
        let sugestoes;
        try {
            if (!consulta) {
                const abas = await chrome.tabs.query({currentWindow:true});
                sugestoes = abas.filter(aba => aba.url).map(aba => ({
                    url:aba.url, titulo:aba.title || aba.url, abaId:aba.id
                }));
            } else {
                const historico = await chrome.history.search({text:consulta, startTime:0, maxResults:500});
                sugestoes = ordenarSugestoesZen(historico, consulta);
            }
        } catch { return; }
        if (atual !== geracao || !campo.isConnected || obterConsulta(campo) !== consulta) return;
        const enderecoDireto = pesquisa.find(item => item.direto)?.url;
        apresentar(campo, [...pesquisa, ...sugestoes.filter(item => item.url !== enderecoDireto)]);
    }

    function entrada(evento) {
        if (abrindoResultado || !evento.target.matches('.quick-command-search')) return;
        clearTimeout(temporizador);
        ++geracao;
        const consulta = obterConsulta(evento.target);
        apresentar(evento.target, sugestoesImediatas(consulta));
        temporizador = setTimeout(()=>pesquisar(evento.target), 100);
    }

    function teclado(evento) {
        if (!lista?.isConnected || !resultados.length
            || !evento.target.matches('.quick-command-search') || evento.isComposing) return;
        if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(evento.key)) return;
        if (evento.altKey || evento.ctrlKey || evento.metaKey || evento.shiftKey) return;
        evento.preventDefault();
        evento.stopImmediatePropagation();
        if (evento.key === 'Enter') abrir(selecionado);
        else selecionar(selecionado + (evento.key === 'ArrowDown' ? 1 : -1));
    }

    document.addEventListener('input', entrada, true);
    document.addEventListener('keydown', teclado, true);
    function inicializar() {
        const campo = document.querySelector('.quick-command-search');
        if (campo === campoAtual) return;
        campoAtual = campo;
        ++geracao;
        limpar();
        if (campo && !abrindoResultado) pesquisar(campo);
    }
    const observador = new MutationObserver(inicializar);
    observador.observe(document.documentElement, {childList:true, subtree:true});
    inicializar();
    window.pesquisaZen = {
        encerrar() {
            ++geracao;
            clearTimeout(temporizador);
            observador.disconnect();
            document.removeEventListener('input', entrada, true);
            document.removeEventListener('keydown', teclado, true);
            limpar();
        }
    };
})();
