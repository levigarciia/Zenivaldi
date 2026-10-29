(() => {
    window.menuBarraZen?.encerrar();
    let quadro = null;
    let botao = null;

    function posicionar() {
        quadro = null;
        const barra = document.querySelector('#browser.tabs-left:not(.is-settingspage) .toolbar-tabbar-before');
        const original = document.querySelector('#header > button.vivaldi');
        if (!barra || !original || botao?.isConnected) return;
        botao = original.cloneNode(true);
        botao.removeAttribute('id');
        botao.addEventListener('click', () => original.click());
        barra.append(botao);
    }

    const observador = new MutationObserver(() => {
        if (quadro === null) quadro = requestAnimationFrame(posicionar);
    });
    observador.observe(document.documentElement, { childList: true, subtree: true });
    posicionar();
    window.menuBarraZen = {
        encerrar() {
            observador.disconnect();
            if (quadro !== null) cancelAnimationFrame(quadro);
            botao?.remove();
        }
    };
})();
