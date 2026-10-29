<div align="center">

<h1>Zenivaldi</h1>

<p>Seu Vivaldi com mais espaço e um visual inspirado no Zen Browser.</p>

<p>Abas na lateral. Pesquisa flutuante. Links que abrem direto.</p>

<p>
<a href="https://github.com/levigarciia/Zenivaldi/releases/latest"><strong>Baixar para Windows</strong></a>
 · <a href="#como-instalar">Como instalar</a>
 · <a href="#como-remover">Como remover</a>
 · <a href="https://github.com/levigarciia/Zenivaldi/issues">Relatar um problema</a>
</p>

</div>

![Interface do Zenivaldi com abas laterais e tema escuro](docs/images/visao-geral.png)

<p align="center"><em>Captura real do Vivaldi em perfil de demonstração, com página e dados fictícios.</em></p>

| Mais espaço | Pesquisa mais clara | Instalação simples |
| :--- | :--- | :--- |
| Abas organizadas na lateral e recolhimento automático opcional. | Endereços simples primeiro e Google sempre disponível. | Baixe, extraia e execute. Sem ferramentas de programação. |

## Cole um link e abra direto

Ao colar um endereço, **Abrir endereço** já fica selecionado. Pressione **Enter** para abrir o site. A opção de pesquisar no Google continua no topo, caso você prefira.

![Pesquisa flutuante com o link selecionado para abrir e o Google como alternativa](docs/images/abrir-link.png)

Funciona também com domínios sem `https://`, como `exemplo.com/leituras`, mesmo que você nunca tenha visitado o endereço. O modal fecha ao abrir o resultado e mantém o visual ao ser aberto novamente.

## Instale sem programar

O pacote tem dois arquivos para usar com dois cliques: **Instalar.cmd** para instalar ou reaplicar e **Remover.cmd** para desativar. Você não precisa mexer nos arquivos de código.

## O que muda

* Abas verticais com ícones alinhados e animação suave quando outras abas sobem após um fechamento.
* Pesquisa flutuante com o mesmo visual ao abrir e durante a digitação.
* Sugestões que priorizam a página principal dos sites e reduzem endereços repetidos.
* Opção de pesquisar no Google sempre visível no topo da lista.
* Lista sem barra de rolagem visível. A roda do mouse e as setas continuam funcionando.
* Fechamento do modal ao abrir um resultado com clique ou Enter.
* Ajuste de posição dos popups para evitar que fiquem cortados pela janela.
* Barra lateral que recolhe mais rápido, respeitando campos de texto e popups abertos.

O Zenivaldi modifica a interface do Vivaldi. Ele não instala o Zen Browser e não troca o mecanismo que abre os sites.

## Antes de instalar

* Windows 10 ou 11 com Vivaldi instalado para o seu usuário, no local padrão.
* Abra o Vivaldi pelo menos uma vez antes de instalar.
* Feche todas as janelas do Vivaldi. O instalador avisa se ele ainda estiver aberto.

A interface foi validada no Vivaldi **8.2.4133.96**. Como o mod depende de partes internas do navegador, outras versões podem precisar de ajustes.

O instalador não precisa de Bun, Node.js, Git ou editor de código. Ele usa o PowerShell que já vem no Windows.

## Como instalar

1. Abra a [página de downloads](https://github.com/levigarciia/Zenivaldi/releases/latest).
2. Em **Assets**, baixe **Zenivaldi.zip**.
3. Clique com o botão direito no arquivo baixado e escolha **Extrair Tudo**.
4. Abra a pasta extraída. Não execute o instalador de dentro do ZIP.
5. Feche o Vivaldi e dê dois cliques em **Instalar.cmd**.
6. Aguarde a mensagem de instalação concluída e abra o Vivaldi novamente.

Pronto. O instalador ativa o carregamento do CSS e dos scripts e cria um backup antes das alterações.

Se o Windows mostrar uma confirmação para executar o arquivo, confira se ele veio deste repositório. Não é necessário desativar o antivírus nem mudar configurações permanentes de segurança.

## Como deixar a organização parecida com o Zen

O instalador cuida do visual. A posição das barras é uma configuração do próprio Vivaldi:

1. Abra **Configurações > Abas** e escolha a posição da barra de abas **Esquerda**.
2. Se quiser a barra recolhendo automaticamente, procure **Ocultar automaticamente** nas configurações e ative para a barra de abas.
3. Para mover o campo de endereço para a lateral, use **Editar > Personalizar barra de ferramentas** no menu de contexto de uma barra. Arraste o campo de endereço para a parte superior da barra de abas e finalize a edição.
4. Abra a pesquisa flutuante com **F2**, chamada **Comandos rápidos** no Vivaldi.
5. Se preferir usar **Ctrl+T**, abra **Configurações > Teclado**, remova esse atalho de **Nova aba** e atribua a **Comandos rápidos**.

Os nomes e a localização dessas opções podem variar conforme a versão e o idioma do Vivaldi. O instalador não reorganiza suas barras nem substitui seus atalhos.

## Como usar a pesquisa

* Sem texto: mostra as abas da janela atual. Escolher uma delas ativa a aba existente.
* Com texto: busca no histórico local e prioriza endereços mais simples.
* **Pesquisar com Google**: fica fixo no topo, mesmo quando há sugestões de sites.
* Ao colar um link ou digitar um domínio, **Abrir endereço** aparece e começa selecionado. Enter abre o link diretamente, mesmo que ele nunca tenha sido visitado. A pesquisa no Google continua disponível.
* **Setas**: mudam a opção selecionada. **Enter**: abre a seleção. Você também pode clicar.
* Havendo sugestões de sites, a primeira delas começa selecionada. Para pesquisar no Google, clique na primeira linha ou use a seta para cima até selecioná la.

A opção do Google usa explicitamente o Google, mesmo que outro buscador esteja configurado no navegador. As sugestões vêm do histórico local. Não há um servidor do Zenivaldi recebendo o que você digita; a pesquisa escolhida é enviada ao Google quando você a abre.

## Atualizou o Vivaldi e o visual sumiu?

Isso pode acontecer porque uma atualização substitui os arquivos que carregam os scripts. O CSS pode continuar aparecendo enquanto a lista de pesquisa volta ao visual original.

1. Feche o Vivaldi.
2. Abra a pasta do Zenivaldi e execute **Instalar.cmd** novamente.
3. Abra o navegador.

Não é preciso desinstalar antes. Se uma versão nova continuar com problema, veja se há uma [versão atualizada do mod](https://github.com/levigarciia/Zenivaldi/releases).

## Como remover

Feche o Vivaldi e dê dois cliques em **Remover.cmd** na pasta extraída.

Isso desativa os scripts deste instalador e restaura a configuração anterior de carregamento do CSS. Os backups são mantidos. As posições das barras e os atalhos que você ajustou manualmente continuam como estavam.

O script de recolhimento ajusta os tempos internos de animação da barra. Esses valores podem permanecer após a remoção, e podem ser ajustados nas configurações do Vivaldi.

## Onde os arquivos ficam

* Mod instalado: `%LOCALAPPDATA%\Vivaldi\Zenivaldi`.
* Backups: `%LOCALAPPDATA%\Vivaldi\ZenivaldiBackups`.
* Scripts carregados: pasta `user_files\zenivaldi` dentro dos recursos da versão instalada do Vivaldi.

O instalador altera o documento da interface, a pasta de CSS e a opção experimental que permite CSS personalizado. Ele não importa nem apaga suas senhas, favoritos ou histórico. Os backups de preferências são locais e podem conter configurações pessoais. Não publique essa pasta.

Se você já usa outro mod de CSS, o Zenivaldi passa a ser a pasta de CSS ativa. A configuração anterior é guardada para a remoção. A combinação com outros mods não foi validada.

## Problemas comuns

**O instalador diz que o Vivaldi está aberto:** feche todas as janelas. Se continuar, verifique no Gerenciador de Tarefas se há processos do Vivaldi em segundo plano.

**O Vivaldi não foi encontrado:** a instalação por dois cliques atende à pasta padrão do usuário. Instalações portáteis, para todos os usuários e perfis adicionais exigem informar os caminhos manualmente. Consulte a seção técnica abaixo.

**A animação não aparece:** o mod respeita a preferência do Windows por reduzir movimentos. A animação de fechamento se aplica ao deslocamento das abas não fixadas na lateral esquerda.

**Algo ficou fora do lugar:** confirme a posição das abas à esquerda, reaplique o instalador após uma atualização e confira a versão validada acima.

**Ainda não funcionou:** [abra um relato de problema](https://github.com/levigarciia/Zenivaldi/issues/new) com a versão do Vivaldi, sua versão do Windows e uma imagem sem dados pessoais.

## Para quem desenvolve

Os arquivos do mod estão em `src`. O instalador está em `scripts/Configurar.ps1` e funciona no Windows PowerShell 5.1.

Com [Bun](https://bun.sh) instalado, execute:

```powershell
bun test
```

Os testes criam uma instalação simulada e verificam instalação, reaplicação e remoção. Não usam seu perfil real. Os testes de interface nativa foram feitos separadamente em perfil isolado do Vivaldi; não fazem parte da suíte automática.

Para uma instalação em outro caminho que mantenha as pastas `Application` e `User Data`:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Configurar.ps1 -RaizVivaldi 'D:\Aplicativos\Vivaldi' -Perfil 'Default'
```

Para remover, use os mesmos argumentos e acrescente `-Remover`. O perfil padrão é `Default`. O instalador atende a um perfil por instalação e não procura automaticamente pastas de dados personalizadas. Instalações em pastas protegidas podem exigir permissões adicionais.

## Créditos

Projeto independente, inspirado no Zen Browser e feito para o Vivaldi. Não é um produto oficial de nenhum dos dois navegadores.
