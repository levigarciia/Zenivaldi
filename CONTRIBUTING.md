# Contributing to Zenivaldi

[Português brasileiro](docs/CONTRIBUTING.pt-BR.md)

## Local development

Use Windows with PowerShell 5.1 and [Bun](https://bun.sh). End users do not need development tools.

Run the checks from the repository folder:

```powershell
bun test
```

The tests create temporary installations. They cover layout and shortcut setup, preference restoration, update integrity,
offline repair and browser detection. They do not use your real browser profile, contact GitHub or register scheduled tasks.

Keep development changes local until they are ready for review. Do not create a commit, push or publish a release without
the maintainer asking you to do so.

## Project structure

| Location | Purpose |
| :--- | :--- |
| `src/manifesto.json` | Ordered UI scripts, stylesheets and page resources installed with the mod. |
| `src/zeni-paginas.js` | Page integration and communication with the browser UI. |
| `src/zeni-pagina-inicio.js` | Link detection and HTML media controls in the isolated page context. |
| `src/zeni-midia-inicio.js` | Media Session action detection in the page context. |
| `src/zeni-peek.js` | Interactive preview and temporary tab lifecycle. |
| `src/zeni-player.js` | Sidebar playback controls and source selection. |
| `scripts/Configurar.ps1` | Installation, backups and removal. |
| `scripts/Layout.ps1` | Sidebar layout and shortcut setup, with restoration. |
| `scripts/Atualizar.ps1` | Update verification and repair. |
| `tests` | Isolated filesystem tests. |

## Working safely

* Follow [the repository instructions](docs/AGENTS.md).
* Use Portuguese for new internal identifiers and comments when practical.
* Keep `README.md` and `CONTRIBUTING.md` in English. Keep their Portuguese versions under `docs` in sync.
* Never add browser profiles, cookies, history, backups or personal screenshots to Git.
* Test against a separate Vivaldi installation and an empty profile.
* Disable scheduled updates in development so the development package stays separate from the installed stable version.
* Preserve existing preferences and shortcuts that are unrelated to the mod.
* Keep copyright and attribution notices when adapting third party code.

## Testing an installation

Prepare a disposable Vivaldi installation with `Application` and `User Data` folders. Start it once and close it before
running the installer. Use an explicit path:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Configurar.ps1 -RaizVivaldi 'D:\Tests\Vivaldi' -SemAtualizacaoAutomatica
```

For removal, use the same arguments and add `-Remover`. The default profile is `Default`; use `-Perfil` for another profile
in that installation. Custom data folders outside that structure are not discovered automatically.

## Native UI checks

The automatic tests do not prove native rendering, media playback or webview behavior. Before handing off changes, verify:

1. A fresh installation positions tabs on the left, enables automatic hiding and places the address field in the sidebar.
2. Ctrl+T and F2 open the search modal. Check initial state, typing, direct links, Google search and keyboard navigation.
3. Enter closes the modal. Reopening it keeps the custom appearance.
4. Opening and closing the sidebar leaves the page rectangle unchanged.
5. Closing the bottom tab animates its exit. Closing a middle tab also animates the remaining tabs moving up.
6. Reduced motion disables these animations.
7. Alt+click opens a large page in ZeniPeek. Test dismissal, opening in a regular tab and native side by side tiling.
8. ZeniPlayer starts compact and expands on hover or keyboard focus. Test playback controls and source selection.
   Enter picture in picture and check that the player disappears, then returns when picture in picture closes.
9. Closing a preview removes its temporary tab. Closing a media tab removes its controls.
10. Installation, reapplication and removal preserve unrelated settings.

Keep the exact tested browser version and limitations in [the validation record](docs/VALIDACAO.md).

## Screenshots

Use a separate profile with fictional content. Hide window controls and the bottom status bar only for presentation
captures; keep the browser controls available in the actual product. Do not publish account details or private URLs.

Capture the interface itself rather than building a mockup. Do not imply a feature works solely because its UI appears.

## Reference and license

ZeniPeek and ZeniPlayer draw on the feature design and Vivaldi integration techniques in
[Awesome Vivaldi](https://github.com/PaRr0tBoY/Awesome-Vivaldi). See [third party notices](THIRD_PARTY_NOTICES.md) and
[the GPL version 3 license](LICENSE). Maintain these notices when distributing modified versions.
