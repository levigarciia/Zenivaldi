import { test, expect } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

test('instala, reaplica e remove sem perder preferências existentes', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'zenivaldi-'));
    const recursos = join(raiz, 'Application', '8.2.4133.96', 'resources', 'vivaldi');
    const dados = join(raiz, 'User Data');
    mkdirSync(recursos, { recursive: true });
    mkdirSync(join(dados, 'Default'), { recursive: true });
    writeFileSync(join(recursos, 'window.html'), '<html><head>\n</head><body></body></html>');
    const preferencias = join(dados, 'Default', 'Preferences');
    writeFileSync(preferencias, JSON.stringify({
        vivaldi: { appearance: { css_ui_mods_directory: 'C:\\EstiloAnterior' } },
        exemplo: { manter: [1, 2], nome: 'Preferência existente' }
    }));
    writeFileSync(join(dados, 'Local State'), JSON.stringify({
        browser: { enabled_labs_experiments: ['outra-opcao@1'] }, exemplo: true
    }));
    const executar = (remover = false) => {
        const processo = Bun.spawnSync(['powershell.exe', '-NoProfile', '-ExecutionPolicy', 'Bypass',
            '-File', resolve('scripts/Configurar.ps1'), '-RaizVivaldi', raiz, '-SemAtualizacaoAutomatica',
            ...(remover ? ['-Remover'] : [])]);
        expect(processo.exitCode).toBe(0);
    };
    try {
        executar();
        executar();
        const html = readFileSync(join(recursos, 'window.html'), 'utf8');
        expect(html.match(/user_files\/zenivaldi\/pesquisa.js/g)).toHaveLength(1);
        expect(readFileSync(join(recursos, 'user_files', 'zenivaldi', 'pesquisa.js'), 'utf8'))
            .toBe(readFileSync('src/pesquisa.js', 'utf8'));
        const atualizado = JSON.parse(readFileSync(preferencias, 'utf8'));
        expect(atualizado.exemplo).toEqual({ manter: [1, 2], nome: 'Preferência existente' });
        expect(atualizado.vivaldi.appearance.css_ui_mods_directory).toBe(join(raiz, 'Zenivaldi'));
        const recursosNovos = join(raiz, 'Application', '8.2.4133.97', 'resources', 'vivaldi');
        mkdirSync(recursosNovos, { recursive: true });
        writeFileSync(join(recursosNovos, 'window.html'), '<html><head>\n</head><body></body></html>');
        executar();
        expect(readFileSync(join(recursosNovos, 'window.html'), 'utf8')).toContain('user_files/zenivaldi');
        atualizado.exemplo.novo = 'Preservar também após remover';
        writeFileSync(preferencias, JSON.stringify(atualizado));
        executar(true);
        const removido = JSON.parse(readFileSync(preferencias, 'utf8'));
        expect(removido.vivaldi.appearance.css_ui_mods_directory).toBe('C:\\EstiloAnterior');
        expect(removido.exemplo.novo).toBe('Preservar também após remover');
        expect(readFileSync(join(recursosNovos, 'window.html'), 'utf8')).not.toContain('user_files/zenivaldi');
        expect(JSON.parse(readFileSync(join(dados, 'Local State'), 'utf8')).browser.enabled_labs_experiments)
            .toEqual(['outra-opcao@1']);
    } finally {
        rmSync(raiz, { recursive: true, force: true });
    }
}, 30000);
