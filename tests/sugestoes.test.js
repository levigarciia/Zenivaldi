import { test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';

const codigo = readFileSync('src/pesquisa.js', 'utf8').split('(() => {')[0];
const ordenar = new Function(`${codigo}; return ordenarSugestoesZen;`)();
const obterEndereco = new Function(`${codigo}; return obterEnderecoDireto;`)();
const listarAbas = new Function(`${codigo}; return listarAbasNormais;`)();

test('a pesquisa não expõe abas temporárias de prévias e painéis', () => {
    const abas = listarAbas([
        {id:1, url:'https://exemplo.com/', title:'Site'},
        {id:2, url:'https://exemplo.com/previa', vivExtData:JSON.stringify({panelId:'ZENI_PEEK_teste'})},
        {id:3, url:'https://exemplo.com/painel', vivExtData:JSON.stringify({panelId:'painel-nativo'})},
        {id:4, url:'https://exemplo.com/fixada', pinned:true}
    ]);
    expect(abas.map(aba => aba.abaId)).toEqual([1, 4]);
});

test('reconhece links completos e domínios sem depender do histórico', () => {
    for (const endereco of [
        'https://www.instagram.com/majijs__/',
        'http://localhost:3000/caminho?q=teste#secao',
        'https://exemplo.com/perfil/?chave=valor#final'
    ]) expect(obterEndereco(endereco)).toBe(endereco);
    expect(obterEndereco('exemplo.com/perfil')).toBe('https://exemplo.com/perfil');
    expect(obterEndereco('  https://exemplo.com/  ')).toBe('https://exemplo.com/');
    expect(obterEndereco('127.0.0.1:3000')).toBe('https://127.0.0.1:3000/');
});

test('mantém texto comum e protocolos não navegáveis como pesquisa', () => {
    for (const consulta of ['', 'instagram', 'teste de pesquisa', 'javascript:teste',
        'data:text/plain,teste', 'file:///C:/arquivo', 'ftp://exemplo.com', 'https://']) {
        expect(obterEndereco(consulta)).toBeNull();
    }
});

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
