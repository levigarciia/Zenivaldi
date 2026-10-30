(() => {
    window.menuBarraZen?.encerrar();
    let quadro = null;
    const botoes = new Map();
    const origens = {
        menu: '.toolbar-mainbar > button.vivaldi, #header > button.vivaldi',
        painel: '.toolbar-mainbar button[data-name="PanelToggle"]'
    };

    function adicionarBotao(barra, nome, original) {
        if (botoes.get(nome)?.isConnected) return;
        const grupo = document.createElement('div');
        grupo.className = `button-toolbar zen-${nome}-slot`;
        const botao = original.cloneNode(true);
        botao.removeAttribute('id');
        botao.removeAttribute('style');
        botao.removeAttribute('hidden');
        botao.removeAttribute('inert');
        botao.className = 'ToolbarButton-Button';
        botao.tabIndex = 0;
        if (nome === 'menu') {
            const icone = original.querySelector('.vivaldi-v svg') || original.querySelector('svg');
            if (icone) botao.replaceChildren(icone.cloneNode(true));
            else botao.textContent = 'V';
            botao.addEventListener('mousedown', evento => {
                if (evento.button !== 0) return;
                evento.preventDefault();
                const retangulo = botao.getBoundingClientRect();
                const navegador = document.querySelector('#browser');
                navegador.style.setProperty('--zen-menu-esquerda', `${retangulo.left}px`);
                navegador.style.setProperty('--zen-menu-topo', `${retangulo.top}px`);
                document.querySelector(origens.menu)?.dispatchEvent(new MouseEvent('mousedown', {
                    bubbles:true, button:0, buttons:1, clientX:evento.clientX, clientY:evento.clientY
                }));
            });
            botao.addEventListener('keydown', evento => {
                if (!['Enter', ' '].includes(evento.key)) return;
                evento.preventDefault();
                botao.dispatchEvent(new MouseEvent('mousedown', {bubbles:true, button:0}));
            });
        } else {
            botao.addEventListener('click', () => {
                const painel = document.querySelector(origens.painel);
                for (const tipo of ['pointerdown', 'pointerup']) {
                    painel?.dispatchEvent(new PointerEvent(tipo, {
                        bubbles:true, button:0, pointerId:1, pointerType:'mouse', isPrimary:true
                    }));
                }
            });
        }
        grupo.append(botao);
        barra.append(grupo);
        botoes.set(nome, grupo);
    }

    function posicionar() {
        quadro = null;
        const navegador = document.querySelector('#browser');
        const barra = document.querySelector('#browser.tabs-left:not(.is-settingspage) .toolbar-tabbar-before');
        if (!barra) {
            navegador?.classList.remove('zen-barra-integrada');
            return;
        }
        for (const [nome, seletor] of Object.entries(origens)) {
            const original = document.querySelector(seletor);
            if (!original) continue;
            adicionarBotao(barra, nome, original);
            const botao = botoes.get(nome).querySelector('button');
            for (const atributo of ['title', 'aria-label', 'aria-pressed']) {
                const valor = original.getAttribute(atributo);
                if (valor !== null && botao.getAttribute(atributo) !== valor) botao.setAttribute(atributo, valor);
            }
        }
        const pronta = [...botoes.values()].filter(botao => botao.isConnected).length === 2
            && Boolean(barra.querySelector('.UrlBar-AddressField'));
        if (navegador?.classList.contains('zen-barra-integrada') !== pronta) {
            navegador?.classList.toggle('zen-barra-integrada', pronta);
        }
        if (pronta) {
            const lateral = barra.closest('.tabbar-wrapper').getBoundingClientRect().right;
            navegador.style.setProperty('--zen-largura-lateral', `${lateral}px`);
        }
    }

    function transferirFoco(evento) {
        if (!document.querySelector('#browser.zen-barra-integrada')) return;
        if (!evento.target.matches('.mainbar .UrlBar-AddressField input')) return;
        const campo = document.querySelector('.toolbar-tabbar-before .UrlBar-AddressField input.url');
        campo?.focus();
        campo?.select();
    }

    function focarEndereco(evento) {
        if (!evento.ctrlKey || evento.altKey || evento.shiftKey || evento.key.toLowerCase() !== 'l') return;
        if (!document.querySelector('#browser.zen-barra-integrada')) return;
        const campo = document.querySelector('.toolbar-tabbar-before .UrlBar-AddressField input.url');
        if (!campo) return;
        evento.preventDefault();
        evento.stopImmediatePropagation();
        campo.focus();
        campo.select();
    }

    const observador = new MutationObserver(() => {
        if (quadro === null) quadro = requestAnimationFrame(posicionar);
    });
    observador.observe(document.documentElement, {
        childList:true, subtree:true, attributes:true, attributeFilter:['title', 'aria-label', 'aria-pressed']
    });
    const redimensionamento = new ResizeObserver(() => {
        if (quadro === null) quadro = requestAnimationFrame(posicionar);
    });
    const lateral = document.querySelector('.tabbar-wrapper');
    if (lateral) redimensionamento.observe(lateral);
    document.addEventListener('focusin', transferirFoco);
    document.addEventListener('keydown', focarEndereco, true);
    posicionar();
    window.menuBarraZen = {
        encerrar() {
            observador.disconnect();
            redimensionamento.disconnect();
            if (quadro !== null) cancelAnimationFrame(quadro);
            document.removeEventListener('focusin', transferirFoco);
            document.removeEventListener('keydown', focarEndereco, true);
            for (const botao of botoes.values()) botao.remove();
            document.querySelector('#browser')?.classList.remove('zen-barra-integrada');
            document.querySelector('#browser')?.style.removeProperty('--zen-largura-lateral');
            document.querySelector('#browser')?.style.removeProperty('--zen-menu-esquerda');
            document.querySelector('#browser')?.style.removeProperty('--zen-menu-topo');
        }
    };
})();
