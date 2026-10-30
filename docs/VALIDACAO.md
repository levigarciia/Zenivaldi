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

## Validação local da versão 0.2.0

As verificações abaixo usaram uma cópia separada do Vivaldi 8.2.4133.96, com perfil descartável.
Esta versão continua em desenvolvimento, sem publicação.

* Nove testes automáticos passaram, com 87 asserções. Incluem instalação, reaplicação, remoção,
  atualização simulada, manifesto e sugestões de pesquisa.
* O instalador configurou a lateral, a ocultação automática e os atalhos. A remoção restaurou os
  valores anteriores e preservou atalhos não relacionados. Ctrl+T foi conferido nas preferências,
  sem simular a tecla física do sistema operacional.
* ZeniPeek abriu por Alt+clique real em um link. Foram verificados navegação, retorno, abertura
  da URL atual em uma aba normal e fechamento com Escape dentro da prévia. A aba temporária
  foi removida e a aba de origem permaneceu aberta. Abrir em aba recarrega a URL, sem transferir
  formulários ou o estado da página da prévia.
* ZeniPlayer controlou mídia real: reprodução, pausa, posição de oito segundos, volume de 30%,
  próxima faixa pelo MediaSession e seleção entre duas fontes. A capa carregou com largura
  natural de 96 pixels. Vídeo real entrou em Picture in Picture após seis segundos de reprodução.
* Fechar a última aba da lista produziu a animação de saída de 180 milissegundos e removeu a
  cópia visual ao terminar. A abertura da lateral usou 260 milissegundos. Com movimento reduzido,
  a saída foi desativada e a transição da lateral foi reduzida a um milissegundo.
* Sete capturas da interface real foram refeitas com conteúdo fictício. O modo de apresentação
  ocultou os controles da janela e a barra inferior somente na instalação de teste.

Os testes de mídia e prévia usaram páginas locais controladas. Eles não garantem compatibilidade
com todos os sites, serviços com proteção de conteúdo ou outros mods. O perfil principal não foi alterado.

Na revisão visual seguinte, o rodapé foi configurado com Downloads e Nova aba, preservando sua
organização anterior. O player mediu 46 pixels recolhido e 96 pixels expandido no perfil de teste.
Passar o mouse revelou título e progresso. Entrar em PiP com vídeo real removeu o player da lateral;
sair do PiP restaurou os controles. Isso também foi conferido com outra fonte de áudio disponível
e com o vídeo em uma segunda janela do navegador.
O Peek passou a ocupar quase toda a altura, com três ações circulares à direita. Abrir lado a lado
produziu duas páginas reais com o mesmo grupo de divisão nativo. Fechar a prévia removeu sua aba temporária.
O ciclo de abrir, digitar, confirmar com Enter e reabrir a pesquisa foi repetido após os ajustes.

Para as extensões, o instalador passou a ativar o seletor único e a lista suspensa nativa, restaurando
os valores anteriores na remoção. Um controle de teste dentro da barra real recebeu o clique diretamente,
permaneceu visível ao receber foco e abriu um popup de 300 pixels dentro dos limites da janela.
Essa verificação cobre interação e geometria com um controle de teste, não a execução de uma extensão instalada.
A revisão automática bloqueou o comando que carregaria uma extensão de teste, sem fornecer motivo detalhado.

## Compatibilidade do atualizador com versões anteriores

Onze testes passaram, com 91 asserções. O atualizador reconhece os seis scripts e o CSS dos pacotes
anteriores à versão 0.2.0, que não continham `src/manifesto.json`. Foram conferidos o caso já instalado
e o reparo offline de um arquivo ausente. Pacotes novos sem manifesto continuam sendo recusados como incompletos.

## Antes de publicar uma mudança na interface

1. Use um perfil separado e sem dados pessoais.
2. Confira a lista inicial, a digitação rápida e uma consulta sem correspondências.
3. Confira se o Google permanece visível com sugestões de sites.
4. Execute por clique e Enter, depois reabra o modal.
5. Feche uma aba intermediária com a barra lateral aberta e confira a animação.
6. Confira popups próximos das bordas em mais de um tamanho de janela.
