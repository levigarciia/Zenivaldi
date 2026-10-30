(() => {
    window.autohideBarraZen?.encerrar();
    let temporizador = null;
    let encerrado = false;

    const ajustes = {
        auto_hide_close_delay: 180,
        auto_hide_inactive_delay: 300,
        auto_hide_animation_speed: 260,
        auto_hide_closing_animation_speed: 200
    };

    async function configurar() {
        if (encerrado) return;
        if (!window.vivaldi?.prefs?.set) {
            temporizador = setTimeout(configurar, 100);
            return;
        }
        temporizador = null;
        for (const [nome, valor] of Object.entries(ajustes)) {
            if (encerrado) return;
            await vivaldi.prefs.set({ path: `vivaldi.biscuit.${nome}`, value: valor });
        }
    }

    function reavaliar() {
        temporizador = null;
        const barra = document.querySelector('#browser.auto-hide .auto-hide-wrapper.left.has-tabbar.show');
        if (!barra || barra.matches(':hover')) return;
        const foco = document.activeElement;
        if (barra.contains(foco) && foco.matches('input, textarea, select, [contenteditable="true"]')) return;
        if (document.querySelector('.menu-open, .button-popup, .extension-popup, .resizing, #modal-bg')) return;
        barra.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    }

    function agendar() {
        if (!encerrado && temporizador === null) temporizador = setTimeout(reavaliar, 200);
    }

    const observador = new MutationObserver(agendar);
    observador.observe(document.documentElement, {
        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
    });
    document.addEventListener('pointerout', agendar, true);
    configurar().catch(erro => console.error('Não foi possível ajustar o autohide', erro));

    window.autohideBarraZen = {
        encerrar() {
            encerrado = true;
            observador.disconnect();
            document.removeEventListener('pointerout', agendar, true);
            clearTimeout(temporizador);
        }
    };
})();
