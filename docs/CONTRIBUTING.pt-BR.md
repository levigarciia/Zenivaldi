# Contribuindo com o Zenivaldi

[English](../CONTRIBUTING.md)

## Desenvolvimento local

Use Windows, PowerShell 5.1 e [Bun](https://bun.sh). Quem instala o mod não precisa dessas ferramentas de desenvolvimento.

Na pasta do repositório, execute:

```powershell
bun test
```

Os testes criam instalações temporárias. Cobrem configuração de layout e atalhos, restauração de preferências, integridade
da atualização, reparo sem internet e detecção do navegador aberto. Não usam seu perfil real, acessam o GitHub nem agendam tarefas.

Mantenha as alterações locais até a revisão. Não crie commits, envie alterações nem publique releases sem solicitação do mantenedor.

## Estrutura

| Local | Responsabilidade |
| :--- | :--- |
| `src/manifesto.json` | Ordem dos scripts, folhas de estilo e recursos de página instalados. |
| `src/zeni-paginas.js` | Integração e comunicação entre páginas e interface do navegador. |
| `src/zeni-pagina-inicio.js` | Captura de links e controle de mídia no contexto isolado da página. |
| `src/zeni-midia-inicio.js` | Detecção de ações do Media Session no contexto da página. |
| `src/zeni-peek.js` | Prévia interativa e ciclo de vida da aba temporária. |
| `src/zeni-player.js` | Controles de reprodução e seleção de fontes. |
| `scripts/Configurar.ps1` | Instalação, backups e remoção. |
| `scripts/Layout.ps1` | Configuração e restauração de layout e atalhos. |
| `scripts/Atualizar.ps1` | Verificação de atualizações e reparo. |
| `tests` | Testes isolados de arquivos e configuração. |

## Cuidados durante o trabalho

* Siga as [instruções do repositório](AGENTS.md).
* Use português em nomes internos e comentários quando for coerente.
* Mantenha README e CONTRIBUTING em inglês, com as versões em português atualizadas nesta pasta.
* Não inclua perfis, cookies, histórico, backups nem capturas com informações pessoais no Git.
* Use uma instalação separada do Vivaldi e um perfil vazio nos testes.
* Desative as atualizações agendadas no desenvolvimento para separar o pacote local da versão estável instalada.
* Preserve as preferências e os atalhos que não fazem parte do mod.
* Preserve os créditos e os avisos de licença ao adaptar código de terceiros.

## Testando uma instalação

Prepare uma instalação descartável com as pastas `Application` e `User Data`. Abra o navegador uma vez e feche antes de instalar.
Informe o caminho explicitamente:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Configurar.ps1 -RaizVivaldi 'D:\Tests\Vivaldi' -SemAtualizacaoAutomatica
```

Para remover, use os mesmos argumentos e acrescente `-Remover`. O perfil padrão é `Default`; use `-Perfil` para outro perfil
na mesma instalação. Pastas de dados fora dessa estrutura não são descobertas automaticamente.

## Verificação da interface nativa

Os testes automáticos não comprovam renderização, reprodução ou comportamento de webviews. Antes de entregar uma mudança:

1. Confira abas à esquerda, ocultação automática e campo de endereço na lateral em uma instalação limpa.
2. Confira Ctrl+T e F2, lista inicial, digitação, links diretos, Google e navegação pelo teclado.
3. Confirme que Enter fecha o modal e que a aparência é preservada ao reabrir.
4. Abra e feche a lateral e confirme que o retângulo da página não muda.
5. Feche a última aba da lista e confira sua saída. Feche uma aba intermediária e confira o deslocamento das demais.
6. Confira a preferência de reduzir movimentos.
7. Abra uma página grande com Alt+clique no ZeniPeek. Teste fechamento, abertura em aba normal e divisão nativa da tela.
8. Confira o player recolhido e a expansão ao passar o mouse ou usar o teclado. Teste os controles e a seleção de fontes.
   Entre em PiP e confira que o player desaparece da lateral e retorna quando a janela flutuante fecha.
9. Feche a prévia e confira a remoção da aba temporária. Feche a aba de mídia e confira a remoção dos controles.
10. Confira instalação, reaplicação e remoção sem perder configurações não relacionadas.

Registre a versão exata do navegador e as limitações em [VALIDACAO.md](VALIDACAO.md).

## Capturas

Use perfil separado e conteúdo fictício. Oculte os controles da janela e a barra inferior apenas no modo de apresentação
das capturas; preserve o acesso a esses controles no produto. Não publique dados de contas ou URLs privadas.

Capture a interface real. A presença de um elemento visual não basta para afirmar que sua função foi validada.

## Referência e licença

ZeniPeek e ZeniPlayer se baseiam no desenho das funções e nos contratos de integração do
[Awesome Vivaldi](https://github.com/PaRr0tBoY/Awesome-Vivaldi). Consulte os [avisos de terceiros](../THIRD_PARTY_NOTICES.md)
e a [licença GPL versão 3](../LICENSE). Preserve esses avisos ao distribuir versões modificadas.
