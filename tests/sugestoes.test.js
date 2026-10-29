import { test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';

const codigo = readFileSync('src/pesquisa.js', 'utf8').split('(() => {')[0];
const ordenar = new Function(`${codigo}; return ordenarSugestoesZen;`)();

test('prioriza a página principal e evita repetições de fragmentos', () => {
    const resultados = ordenar([
        {url:'https://exemplo.com/p/publicacao/', title:'Publicação', visitCount:90},
        {url:'https://exemplo.com/perfil/', title:'Perfil'},
        {url:'https://exemplo.com/p/publicacao/#comentarios', title:'Publicação repetida'},
        {url:'about:blank', title:'Página interna'}
    ], 'exemplo');
    expect(resultados[0].url).toBe('https://exemplo.com/');
    expect(resultados).toHaveLength(3);
    expect(resultados.at(-1).url).toBe('https://exemplo.com/p/publicacao/');
});
