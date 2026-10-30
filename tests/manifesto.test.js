import { test, expect } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

test('o pacote contém todos os recursos e scripts clássicos válidos', () => {
    const manifesto = JSON.parse(readFileSync('src/manifesto.json', 'utf8'));
    const javascript = [...manifesto.scripts, ...manifesto.recursos];
    const arquivos = [...javascript, ...manifesto.css];
    expect(new Set(arquivos).size).toBe(arquivos.length);
    for (const arquivo of arquivos) expect(existsSync(join('src', arquivo))).toBe(true);
    for (const arquivo of javascript) {
        expect(() => new Function(readFileSync(join('src', arquivo), 'utf8'))).not.toThrow();
    }
    expect(manifesto.scripts.indexOf('zeni-paginas.js')).toBeLessThan(manifesto.scripts.indexOf('zeni-peek.js'));});
