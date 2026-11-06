(() => {
    window.downloadsZen?.encerrar();

    const pendentes = new Map();
    let encerrado = false;

    function abrirBandeja(privado) {
        chrome.windows.getCurrent(janela => {
            if (encerrado || !janela?.focused || janela.incognito !== privado) return;
            if (document.querySelector('.download-popout')) return;
            const botao = document.querySelector('button[data-name="DownloadButton"]');
            botao?.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
            }));
        });
    }

    function registrarDownload(item) {
        if (item.state === 'interrupted') return;
        if (item.state === 'complete') {
            abrirBandeja(item.incognito);
            return;
        }
        pendentes.set(item.id, item.incognito);
    }

    function atualizarDownload(alteracao) {
        if (!pendentes.has(alteracao.id)) return;
        const estado = alteracao.state?.current;
        if (estado !== 'complete' && estado !== 'interrupted') return;
        const privado = pendentes.get(alteracao.id);
        pendentes.delete(alteracao.id);
        if (estado === 'complete') abrirBandeja(privado);
    }

    function removerDownload(id) {
        pendentes.delete(id);
    }

    function abrirArquivo(evento) {
        const alvo = evento.target;
        if (!(alvo instanceof Element) || !alvo.closest('.download-popout')) return;
        evento.stopPropagation();
        if (evento.button !== 0 || alvo.closest('button, input, select, textarea')) return;
        const item = alvo.closest('.tree-item[data-id]');
        if (!item || !alvo.closest('.DownloadItem')) return;
        const id = Number(item.dataset.id);
        if (!Number.isSafeInteger(id) || id < 0) return;
        evento.preventDefault();
        chrome.downloads.open(id, () => {
            if (chrome.runtime.lastError) console.warn(chrome.runtime.lastError.message);
        });
    }

    chrome.downloads.onCreated.addListener(registrarDownload);
    chrome.downloads.onChanged.addListener(atualizarDownload);
    chrome.downloads.onErased.addListener(removerDownload);
    document.addEventListener('dblclick', abrirArquivo, true);

    window.downloadsZen = {
        encerrar() {
            encerrado = true;
            pendentes.clear();
            chrome.downloads.onCreated.removeListener(registrarDownload);
            chrome.downloads.onChanged.removeListener(atualizarDownload);
            chrome.downloads.onErased.removeListener(removerDownload);
            document.removeEventListener('dblclick', abrirArquivo, true);
        }
    };
})();
