# Validação

## Verificação automática

Execute `bun test` no Windows.

* Instalação em estrutura simulada de arquivos.
* Reaplicação sem duplicar os scripts.
* Detecção da pasta de versão mais recente após atualização simulada.
* Remoção preservando preferências criadas depois da instalação.
* Priorização da página principal, deduplicação e descarte de URLs internas nas sugestões.
* Reconhecimento de links completos, domínios sem protocolo e manutenção da pesquisa para texto comum.

Esses testes não alteram a instalação real do Vivaldi.

## Verificação de interface

Os scripts de interface que deram origem a esta distribuição foram testados em perfil isolado do Vivaldi 8.2.4133.96 no Windows:

* Abrir o modal com o visual personalizado.
* Pesquisar e confirmar um resultado com Enter.
* Fechar e reabrir o modal, mantendo o visual.
* Confirmar que dois Enters seguidos não duplicam a abertura.
* Colar um link sem correspondência no histórico e confirmar a opção de abertura direta imediatamente.
* Abrir esse link com Enter, preservando caminho, parâmetros e fragmento, depois reabrir o modal.

Em testes controlados anteriores também foram verificados o deslocamento animado das abas, o reposicionamento de popups e a rolagem sem barra visível. Não foi feita uma validação de todos os sites, extensões, instalações portáteis ou combinações de mods.

## Antes de publicar uma mudança na interface

1. Use um perfil separado e sem dados pessoais.
2. Confira a lista inicial, a digitação rápida e uma consulta sem correspondências.
3. Confira se o Google permanece visível com sugestões de sites.
4. Execute por clique e Enter, depois reabra o modal.
5. Feche uma aba intermediária com a barra lateral aberta e confira a animação.
6. Confira popups próximos das bordas em mais de um tamanho de janela.
