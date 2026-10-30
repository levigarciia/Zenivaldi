# Validação

## Verificação automática

Execute `bun test` no Windows.

* Instalação em estrutura simulada de arquivos.
* Reaplicação sem duplicar os scripts.
* Detecção da pasta de versão mais recente após atualização simulada.
* Remoção preservando preferências criadas depois da instalação.
* Priorização da página principal, deduplicação e descarte de URLs internas nas sugestões.
* Reconhecimento de links completos, domínios sem protocolo e manutenção da pesquisa para texto comum.
* Reparo com pacote em cache, sem rede, e ausência de reinstalação quando o mod está presente.
* Adiamento com o navegador aberto, sem download nem alteração dos arquivos.
* Recusa de ZIP com SHA256 incorreto e atualização com ZIP válido em ambiente simulado.
* Aplicação das preferências e flags de rolagem e restauração dos valores anteriores na remoção.

O registro de uma tarefa temporária também foi validado no Windows: intervalo de uma hora, execução com privilégios limitados e remoção ao desativar. Essa tarefa foi removida ao terminar a validação e não faz parte da suíte automática.

Esses testes não alteram a instalação real do Vivaldi.

## Verificação de interface

Os scripts de interface que deram origem a esta distribuição foram testados em perfil isolado do Vivaldi 8.2.4133.96 no Windows:

* Abrir o modal com o visual personalizado.
* Pesquisar e confirmar um resultado com Enter.
* Fechar e reabrir o modal, mantendo o visual.
* Confirmar que dois Enters seguidos não duplicam a abertura.
* Colar um link sem correspondência no histórico e confirmar a opção de abertura direta imediatamente.
* Abrir esse link com Enter, preservando caminho, parâmetros e fragmento, depois reabrir o modal.
* Integrar menu e controle de painel na lateral e ocultar a barra superior duplicada.
* Alternar o painel pelo botão novo e focar o endereço lateral com Ctrl+L.
* Manter os controles da janela acessíveis e capturar as abas fixadas com ícones de sites públicos.
* Manter o ícone do menu visível mesmo quando o contêiner do ícone original do Vivaldi está oculto.
* Acionar a abertura nativa pela borda no modo de ocultação automática: antes, durante e depois da abertura, o conteúdo manteve a posição vertical de 6 pixels e a mesma altura. O atributo de integração permaneceu ativo durante a atualização das classes nativas.
* Abrir o menu compacto dentro dos limites da lateral, navegar por setas e fechar com Escape.
* Abrir nova aba, histórico, downloads e favoritos pelas opções do menu compacto.
* Ativar as flags nativas de barras sobrepostas e rolagem suave em perfil separado, com reinício do navegador: a diferença entre `innerWidth` e `documentElement.clientWidth` caiu de 15 para 0 pixels na página de teste. PageDown apresentou deslocamento intermediário antes de chegar à posição final, confirmando a animação de rolagem pelo teclado.

Em testes controlados anteriores também foram verificados o deslocamento animado das abas, o reposicionamento de popups e a rolagem sem barra visível. Não foi feita uma validação de todos os sites, extensões, instalações portáteis ou combinações de mods.

## Antes de publicar uma mudança na interface

1. Use um perfil separado e sem dados pessoais.
2. Confira a lista inicial, a digitação rápida e uma consulta sem correspondências.
3. Confira se o Google permanece visível com sugestões de sites.
4. Execute por clique e Enter, depois reabra o modal.
5. Feche uma aba intermediária com a barra lateral aberta e confira a animação.
6. Confira popups próximos das bordas em mais de um tamanho de janela.
