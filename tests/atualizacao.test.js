import { test, expect } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const versaoAtual = JSON.parse(readFileSync('package.json', 'utf8')).version;

function executar(arquivo, argumentos = []) {
    const resultado = Bun.spawnSync(['powershell.exe', '-NoProfile', '-ExecutionPolicy', 'Bypass',
        '-File', arquivo, ...argumentos]);
    if (resultado.exitCode !== 0) throw new Error(resultado.stdout.toString() + resultado.stderr.toString());
}

function preparar() {
    const raiz = mkdtempSync(join(tmpdir(), 'zenivaldi-atualizacao-'));
    const recursos = join(raiz, 'Application', '8.2.4133.96', 'resources', 'vivaldi');
    mkdirSync(recursos, {recursive:true});
    mkdirSync(join(raiz, 'User Data', 'Default'), {recursive:true});
    writeFileSync(join(recursos, 'window.html'), '<html><head>\n</head><body></body></html>');
    writeFileSync(join(recursos, 'prefs_definitions.json'), readFileSync('tests/fixtures/catalogo.json'));
    writeFileSync(join(raiz, 'User Data', 'Default', 'Preferences'), '{}');
    writeFileSync(join(raiz, 'User Data', 'Local State'), '{}');
    const pasta = join(raiz, 'ZenivaldiAtualizador');
    mkdirSync(pasta);
    const configuracao = join(pasta, 'configuracao.json');
    writeFileSync(configuracao, JSON.stringify({
        raiz, perfil:'Default', versao:'0.1.2', pacote:resolve('.'),
        tarefa:`ZenivaldiTeste${Date.now()}`, habilitada:true
    }));
    return {raiz, recursos, configuracao, pasta};
}

test('repara sem rede e não reinstala quando os arquivos estão presentes', () => {
    const dados = preparar();
    try {
        executar(resolve('scripts/Atualizar.ps1'), ['-Configuracao', dados.configuracao, '-SomenteCache']);
        expect(readFileSync(join(dados.recursos, 'window.html'), 'utf8')).toContain('user_files/zenivaldi');
        const backups = readdirSync(join(dados.raiz, 'ZenivaldiBackups')).length;
        executar(resolve('scripts/Atualizar.ps1'), ['-Configuracao', dados.configuracao, '-SomenteCache']);
        expect(readdirSync(join(dados.raiz, 'ZenivaldiBackups'))).toHaveLength(backups);
    } finally { rmSync(dados.raiz, {recursive:true, force:true}); }
}, 30000);

test('adia quando o navegador está aberto e não baixa nem altera arquivos', () => {
    const dados = preparar();
    try {
        const roteiro = join(dados.raiz, 'aberto.ps1');
        writeFileSync(roteiro, `param($Configuracao, $Atualizador, $Raiz)
function Get-Process { param($Name, $ErrorAction) [pscustomobject]@{Path=(Join-Path $Raiz 'Application\\vivaldi.exe')} }
function Invoke-RestMethod { throw 'A rede não deveria ser usada' }
& $Atualizador -Configuracao $Configuracao
`);
        executar(roteiro, ['-Configuracao', dados.configuracao, '-Atualizador', resolve('scripts/Atualizar.ps1'),
            '-Raiz', dados.raiz]);
        expect(readFileSync(join(dados.recursos, 'window.html'), 'utf8')).not.toContain('zenivaldi');
        expect(readFileSync(join(dados.pasta, 'ultimo-resultado.txt'), 'utf8')).toContain('Vivaldi aberto');
    } finally { rmSync(dados.raiz, {recursive:true, force:true}); }
}, 30000);

test('aceita cache legado sem manifesto e mantém o reparo offline', () => {
    const dados = preparar();
    try {
        const pacote = join(dados.pasta, 'pacotes', '0.1.5');
        mkdirSync(join(pacote, 'src'), {recursive:true});
        mkdirSync(join(pacote, 'scripts'));
        writeFileSync(join(pacote, 'package.json'), JSON.stringify({name:'zenivaldi', version:'0.1.5'}));
        const nomes = ['animacoes-abas.js', 'autohide-barra.js', 'menu-compacto.js',
            'menu-barra.js', 'popups.js', 'pesquisa.js'];
        const destinoScripts = join(dados.recursos, 'user_files', 'zenivaldi');
        mkdirSync(destinoScripts, {recursive:true});
        mkdirSync(join(dados.raiz, 'Zenivaldi'));
        writeFileSync(join(dados.raiz, 'Zenivaldi', 'zen.css'), '');
        for (const nome of nomes) {
            writeFileSync(join(pacote, 'src', nome), '');
            writeFileSync(join(destinoScripts, nome), '');
        }
        writeFileSync(join(dados.recursos, 'window.html'), nomes.map(nome =>
            `<script src="user_files/zenivaldi/${nome}"></script>`).join('\n'));
        writeFileSync(join(pacote, 'scripts', 'Configurar.ps1'), `param($RaizVivaldi, $Perfil,
    [switch]$SemAtualizacaoAutomatica)
$recursos = Join-Path $RaizVivaldi 'Application\\8.2.4133.96\\resources\\vivaldi'
Copy-Item -Path (Join-Path $PSScriptRoot '..\\src\\*.js') -Destination (Join-Path $recursos 'user_files\\zenivaldi')
Write-Output 'Reparo legado executado'
`);
        const configuracao = JSON.parse(readFileSync(dados.configuracao, 'utf8'));
        configuracao.versao = '0.1.5';
        configuracao.pacote = pacote;
        writeFileSync(dados.configuracao, JSON.stringify(configuracao));
        const argumentos = ['-Configuracao', dados.configuracao, '-SomenteCache'];
        executar(resolve('scripts/Atualizar.ps1'), argumentos);
        expect(readFileSync(join(dados.pasta, 'ultimo-resultado.txt'), 'utf8')).toContain('já está atualizado');
        rmSync(join(destinoScripts, 'popups.js'));
        executar(resolve('scripts/Atualizar.ps1'), argumentos);
        expect(readdirSync(destinoScripts)).toContain('popups.js');
        expect(readFileSync(join(dados.pasta, 'ultimo-resultado.txt'), 'utf8')).toContain('0.1.5 aplicado');
    } finally { rmSync(dados.raiz, {recursive:true, force:true}); }
}, 30000);

test('recusa pacote novo incompleto em vez de tratar como legado', () => {
    const dados = preparar();
    try {
        const pacote = join(dados.pasta, 'incompleto');
        mkdirSync(pacote);
        cpSync('package.json', join(pacote, 'package.json'));
        const configuracao = JSON.parse(readFileSync(dados.configuracao, 'utf8'));
        configuracao.pacote = pacote;
        writeFileSync(dados.configuracao, JSON.stringify(configuracao));
        expect(() => executar(resolve('scripts/Atualizar.ps1'),
            ['-Configuracao', dados.configuracao, '-SomenteCache'])).toThrow('pacote em cache está incompleto');
    } finally { rmSync(dados.raiz, {recursive:true, force:true}); }
});

test('valida o download antes de aplicar uma versão nova', () => {
    const dados = preparar();
    try {
        const prepararZip = join(dados.raiz, 'pacote.ps1');
        const zip = join(dados.raiz, 'Zenivaldi.zip');
        writeFileSync(prepararZip, `param($Origem, $Destino, $Zip)
$pasta = Join-Path $Destino 'Zenivaldi'
New-Item -ItemType Directory -Path $pasta -Force | Out-Null
foreach($nome in @('src', 'scripts', 'package.json')) {
    Copy-Item -LiteralPath (Join-Path $Origem $nome) -Destination $pasta -Recurse -Force
}
Compress-Archive -LiteralPath $pasta -DestinationPath $Zip
(Get-FileHash -LiteralPath $Zip -Algorithm SHA256).Hash | Set-Content (Join-Path $Destino 'hash.txt')
`);
        executar(prepararZip, ['-Origem', resolve('.'), '-Destino', dados.raiz, '-Zip', zip]);
        const metadados = join(dados.raiz, 'release.json');
        const release = {tag_name:`v${versaoAtual}`, assets:[{
            name:'Zenivaldi.zip', digest:`sha256:${'0'.repeat(64)}`,
            browser_download_url:`https://github.com/levigarciia/Zenivaldi/releases/download/v${versaoAtual}/Zenivaldi.zip`
        }]};
        writeFileSync(metadados, JSON.stringify(release));
        const roteiro = join(dados.raiz, 'rede.ps1');
        writeFileSync(roteiro, `param($Configuracao, $Atualizador, $Metadados, $Zip)
$env:ZENIVALDI_ZIP_TESTE = $Zip
function Invoke-RestMethod { param($Uri, $Headers, $TimeoutSec)
    [IO.File]::ReadAllText($Metadados) | ConvertFrom-Json
}
function Invoke-WebRequest { param($Uri, $OutFile, [switch]$UseBasicParsing, $TimeoutSec)
    Copy-Item -LiteralPath $env:ZENIVALDI_ZIP_TESTE -Destination $OutFile
}
& $Atualizador -Configuracao $Configuracao
`);
        const argumentos = ['-Configuracao', dados.configuracao, '-Atualizador', resolve('scripts/Atualizar.ps1'),
            '-Metadados', metadados, '-Zip', zip];
        executar(roteiro, argumentos);
        expect(JSON.parse(readFileSync(dados.configuracao, 'utf8')).versao).toBe('0.1.2');
        release.assets[0].digest = `sha256:${readFileSync(join(dados.raiz, 'hash.txt'), 'utf8').trim().toLowerCase()}`;
        writeFileSync(metadados, JSON.stringify(release));
        executar(roteiro, argumentos);
        const atualizado = JSON.parse(readFileSync(dados.configuracao, 'utf8'));
        if (atualizado.versao !== versaoAtual) {
            throw new Error(readFileSync(join(dados.pasta, 'ultimo-resultado.txt'), 'utf8'));
        }
        expect(atualizado.versao).toBe(versaoAtual);
        expect(readFileSync(join(atualizado.pacote, 'package.json'), 'utf8')).toContain(versaoAtual);
    } finally { rmSync(dados.raiz, {recursive:true, force:true}); }
}, 60000);
