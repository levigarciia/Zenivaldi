(() => {
    window.popupsZen?.encerrar();
    let quadro = null;
    const ajustados = new Set();
    function ajustar() {
        quadro = null;
        for (const popup of document.querySelectorAll('#browser .button-popup, #browser .extension-popup')) {
            popup.style.removeProperty('translate');
            const retangulo = popup.getBoundingClientRect();
            if (!retangulo.width || !retangulo.height) continue;
            const margem = 8;
            const x = Math.max(margem - retangulo.left, Math.min(0, innerWidth - margem - retangulo.right));
            const y = Math.max(margem - retangulo.top, Math.min(0, innerHeight - margem - retangulo.bottom));
            if (x || y) popup.style.translate = `${x}px ${y}px`;
            ajustados.add(popup);
        }
    }
    function agendar() {
        if (quadro === null) quadro = requestAnimationFrame(ajustar);
    }
    const observador = new MutationObserver(registros => {
        if (registros.some(registro => registro.type === 'childList' || !ajustados.has(registro.target))) agendar();
    });
    observador.observe(document.documentElement, {childList:true, subtree:true, attributes:true,
        attributeFilter:['style', 'class']});
    window.addEventListener('resize', agendar);
    agendar();
    const medirOriginal = Element.prototype.getBoundingClientRect;
    const deslocamentoDoDialogoDeSenha = 70;
    function medir() {
        const pagina = document.querySelector('#browser.tabs-left #webview-container');
        if (!pagina || !this.closest?.('.password-icon')) return medirOriginal.call(this);
        const area = medirOriginal.call(pagina);
        return new DOMRect(area.left + area.width / 2 + deslocamentoDoDialogoDeSenha, area.top, 0, 0);
    }
    Element.prototype.getBoundingClientRect = medir;
    window.popupsZen = {
        encerrar() {
            Element.prototype.getBoundingClientRect = medirOriginal;
            observador.disconnect();
            window.removeEventListener('resize', agendar);
            if (quadro !== null) cancelAnimationFrame(quadro);
            for (const popup of ajustados) popup.style.removeProperty('translate');
        }
    };
})();
