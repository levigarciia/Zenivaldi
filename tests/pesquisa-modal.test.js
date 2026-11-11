import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

test('o popup de abas não impede a inicialização nem recebe as teclas do modal', async () => {
    const ouvintes = new Map();
    let observar;
    let modalAberto = false;
    let consultas = 0;
    const recipiente = {
        classList: { add() {}, remove() {} },
        append() {}
    };
    const campoPopup = { matches: seletor => seletor === '.quick-command-search' };
    const campoModal = {
        isConnected: true,
        value: '',
        selectionStart: 0,
        selectionEnd: 0,
        closest: () => recipiente
    };
    const contexto = {
        window: {}, console, URL, setTimeout, clearTimeout,
        MutationObserver: class {
            constructor(ouvinte) { observar = ouvinte; }
            observe() {}
            disconnect() {}
        },
        chrome: {
            tabs: { query: async () => { consultas++; return []; } }
        },
        document: {
            documentElement: {},
            querySelector: seletor => {
                if (seletor === '.quick-command-search') return campoPopup;
                return modalAberto ? campoModal : null;
            },
            createElement: () => ({ setAttribute() {}, remove() {} }),
            addEventListener: (tipo, ouvinte) => ouvintes.set(tipo, ouvinte),
            removeEventListener: tipo => ouvintes.delete(tipo)
        }
    };
    runInNewContext(readFileSync('src/pesquisa.js', 'utf8'), contexto);
    expect(consultas).toBe(0);
    ouvintes.get('input')({ target: campoPopup });
    expect(consultas).toBe(0);
    modalAberto = true;
    observar();
    await Promise.resolve();
    expect(consultas).toBe(1);
    observar();
    expect(consultas).toBe(1);
    modalAberto = false;
    observar();
    modalAberto = true;
    observar();
    await Promise.resolve();
    expect(consultas).toBe(2);
    contexto.window.pesquisaZen.encerrar();
    expect(ouvintes.size).toBe(0);
});
