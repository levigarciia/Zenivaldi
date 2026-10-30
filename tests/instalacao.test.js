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
    writeFileSync(join(recursos, 'prefs_definitions.json'), readFileSync('tests/fixtures/catalogo.json'));
    const preferencias = join(dados, 'Default', 'Preferences');
    writeFileSync(preferencias, JSON.stringify({
        vivaldi: { appearance: { css_ui_mods_directory: 'C:\\EstiloAnterior' },
            theme: {simple_scrollbar:false}, webpages: {smooth_scrolling:{enabled:false}},
            address_bar:{extensions:{show_all_toggle:false, render_in_dropdown:false}},
            tabs:{bar:{position:0}}, auto_hide:{enabled:false},
            toolbars:{tabbar_before:['Home'], tabbar_after:['TabButton']} },
        exemplo: { manter: [1, 2], nome: 'Preferência existente' }
    }));
    writeFileSync(join(dados, 'Local State'), JSON.stringify({
        browser: { enabled_labs_experiments: ['outra-opcao@1', 'overlay-scrollbars@2', 'smooth-scrolling@2'] },
        exemplo: true
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
        expect(atualizado.vivaldi.theme.simple_scrollbar).toBe(true);
        expect(atualizado.vivaldi.webpages.smooth_scrolling.enabled).toBe(true);
        expect(atualizado.vivaldi.tabs.bar.position).toBe(1);
        expect(atualizado.vivaldi.auto_hide.enabled).toBe(true);
        expect(atualizado.vivaldi.toolbars.tabbar_before).toContain('AddressField');
        expect(atualizado.vivaldi.toolbars.tabbar_after).toEqual(['DownloadButton', 'FlexibleSpacer', 'NewTab']);
        expect(atualizado.vivaldi.address_bar.extensions.show_all_toggle).toBe(true);
        expect(atualizado.vivaldi.address_bar.extensions.render_in_dropdown).toBe(true);
        expect(Array.isArray(atualizado.vivaldi.actions)).toBe(true);
        expect(atualizado.vivaldi.actions[0].COMMAND_NEW_TAB.shortcuts).not.toContain('ctrl+t');
        expect(atualizado.vivaldi.actions[0].COMMAND_SHOW_QUICK_COMMANDS.shortcuts).toEqual(['f2', 'ctrl+t']);
        expect(JSON.parse(readFileSync(join(dados, 'Local State'), 'utf8')).browser.enabled_labs_experiments)
            .toEqual(['outra-opcao@1', 'vivaldi-css-mods@1', 'overlay-scrollbars@1', 'smooth-scrolling@1']);
        const recursosNovos = join(raiz, 'Application', '8.2.4133.97', 'resources', 'vivaldi');
        mkdirSync(recursosNovos, { recursive: true });
        writeFileSync(join(recursosNovos, 'window.html'), '<html><head>\n</head><body></body></html>');
        writeFileSync(join(recursosNovos, 'prefs_definitions.json'), readFileSync('tests/fixtures/catalogo.json'));
        executar();
        expect(readFileSync(join(recursosNovos, 'window.html'), 'utf8')).toContain('user_files/zenivaldi');
        atualizado.exemplo.novo = 'Preservar também após remover';
        atualizado.vivaldi.actions[0].COMMAND_OTHER.shortcuts = ['ctrl+2'];
        writeFileSync(preferencias, JSON.stringify(atualizado));
        executar(true);
        const removido = JSON.parse(readFileSync(preferencias, 'utf8'));
        expect(removido.vivaldi.appearance.css_ui_mods_directory).toBe('C:\\EstiloAnterior');
        expect(removido.exemplo.novo).toBe('Preservar também após remover');
        expect(removido.vivaldi.theme.simple_scrollbar).toBe(false);
        expect(removido.vivaldi.webpages.smooth_scrolling.enabled).toBe(false);
        expect(removido.vivaldi.tabs.bar.position).toBe(0);
        expect(removido.vivaldi.auto_hide.enabled).toBe(false);
        expect(removido.vivaldi.toolbars.tabbar_before).toEqual(['Home']);
        expect(removido.vivaldi.toolbars.tabbar_after).toEqual(['TabButton']);
        expect(removido.vivaldi.address_bar.extensions)
            .toEqual({show_all_toggle:false, render_in_dropdown:false});
        expect(removido.vivaldi.actions[0].COMMAND_NEW_TAB.shortcuts).toEqual(['ctrl+t']);
        expect(removido.vivaldi.actions[0].COMMAND_SHOW_QUICK_COMMANDS.shortcuts).toEqual(['f2']);
        expect(removido.vivaldi.actions[0].COMMAND_OTHER.shortcuts).toEqual(['ctrl+2']);
        expect(readFileSync(join(recursosNovos, 'window.html'), 'utf8')).not.toContain('user_files/zenivaldi');
        expect(JSON.parse(readFileSync(join(dados, 'Local State'), 'utf8')).browser.enabled_labs_experiments)
            .toEqual(['outra-opcao@1', 'overlay-scrollbars@2', 'smooth-scrolling@2']);
    } finally {
        rmSync(raiz, { recursive: true, force: true });
    }
}, 30000);
