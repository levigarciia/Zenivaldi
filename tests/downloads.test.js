import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const codigo = readFileSync('src/downloads.js', 'utf8');

function criarEvento() {
    const ouvintes = new Set();
    return {
        addListener: ouvinte => ouvintes.add(ouvinte),
        removeListener: ouvinte => ouvintes.delete(ouvinte),
        emitir: valor => [...ouvintes].forEach(ouvinte => ouvinte(valor)),
        ouvintes
    };
}

function preparar() {
    const onCreated = criarEvento();
    const onChanged = criarEvento();
    const onErased = criarEvento();
    const abertos = [];
    const teclas = [];
    const ouvintes = new Map();
    const janela = { focused: true, incognito: false };
    const botao = { dispatchEvent: evento => teclas.push(evento) };
    class Elemento {
        constructor(seletores = {}) { this.seletores = seletores; }
        closest(seletor) { return this.seletores[seletor] ?? null; }
    }
    const contexto = {
        window: {}, Element: Elemento, console,
        KeyboardEvent: class {
            constructor(tipo, opcoes) { this.type = tipo; Object.assign(this, opcoes); }
        },
        chrome: {
            runtime: {},
            windows: { getCurrent: retorno => retorno(janela) },
            downloads: { onCreated, onChanged, onErased, open: (id, retorno) => { abertos.push(id); retorno(); } }
        },
        document: {
            querySelector: seletor => seletor.includes('DownloadButton') ? botao : null,
            addEventListener: (tipo, ouvinte) => ouvintes.set(tipo, ouvinte),
            removeEventListener: tipo => ouvintes.delete(tipo)
        }
    };
    runInNewContext(codigo, contexto);
    return { contexto, onCreated, onChanged, onErased, janela, teclas, abertos, ouvintes, Elemento };
}

test('abre uma vez ao concluir, sem abrir enquanto aguarda salvar ou ao cancelar', () => {
    const ambiente = preparar();
    const { onCreated, onChanged, teclas } = ambiente;
    onCreated.emitir({ id: 1, state: 'in_progress', incognito: false });
    onChanged.emitir({ id: 1, filename: { current: 'C:\\Downloads\\arquivo.txt' } });
    expect(teclas).toHaveLength(0);
    onChanged.emitir({ id: 1, state: { current: 'complete' } });
    expect(teclas).toHaveLength(1);
    expect(teclas[0].keyCode).toBe(13);
    onChanged.emitir({ id: 1, state: { current: 'complete' } });
    onCreated.emitir({ id: 2, state: 'in_progress', incognito: false });
    onChanged.emitir({ id: 2, state: { current: 'interrupted' } });
    onChanged.emitir({ id: 100, state: { current: 'complete' } });
    expect(teclas).toHaveLength(1);
});

test('respeita a janela ativa e o contexto privado', () => {
    const { onCreated, janela, teclas } = preparar();
    janela.focused = false;
    onCreated.emitir({ id: 1, state: 'complete', incognito: false });
    janela.focused = true;
    onCreated.emitir({ id: 2, state: 'complete', incognito: true });
    expect(teclas).toHaveLength(0);
    onCreated.emitir({ id: 3, state: 'complete', incognito: false });
    expect(teclas).toHaveLength(1);
});

test('o clique duplo abre o arquivo e não chega à área das abas', () => {
    const { ouvintes, Elemento, abertos } = preparar();
    let propagou = true;
    const alvo = new Elemento({
        '.download-popout': {}, '.DownloadItem': {}, '.tree-item[data-id]': { dataset: { id: '42' } }
    });
    ouvintes.get('dblclick')({
        target: alvo, button: 0, stopPropagation: () => { propagou = false; }, preventDefault() {}
    });
    expect(abertos).toEqual([42]);
    expect(propagou).toBe(false);
    ouvintes.get('dblclick')({
        target: new Elemento(), button: 0, stopPropagation: () => { throw Error('Clique externo bloqueado'); }
    });
    expect(abertos).toEqual([42]);
});

test('reaplicar e encerrar não duplica os ouvintes', () => {
    const { contexto, onCreated, onChanged, onErased, ouvintes } = preparar();
    runInNewContext(codigo, contexto);
    expect(onCreated.ouvintes.size).toBe(1);
    contexto.window.downloadsZen.encerrar();
    expect(onCreated.ouvintes.size).toBe(0);
    expect(onChanged.ouvintes.size).toBe(0);
    expect(onErased.ouvintes.size).toBe(0);
    expect(ouvintes.size).toBe(0);
});
