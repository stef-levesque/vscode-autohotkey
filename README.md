# Visual Studio Code Autohotkey Simple Support

A personal edition modified from [vscode-autohotkey](https://github.com/vinnyjames/vscode-autohotkey)  
And Microsoft lsp-simple

AutoHotKey language support for VS Code

## What's New

1. Experimental hint for where symbol is included on completion. ONLY work on global symbol.
2. Enumerate include
   * Documents must be explicitly included by `#include`
   * **Notice** `#include DirName` are not implemented now
   * Include completion
   * Experimental support for `#include <LibName>`
3. Document formation, supports both v1 and v2 
4. Build-in Variable and Function(partly) hint.
   - Need documentions which is easy to be parsed by js/ts. If you find any, help please([Example](others/Contribute.md)).

## Notice

* This is a parser based on regular expression. The results are not guaranteed.
* If you need a debugger, just install any debug extension in market. As recommended options, [AutoHotKey Debug](https://marketplace.visualstudio.com/items?itemName=helsmy.autohotkey-debug) by me or [vscode-autohotkey-debug](https://marketplace.visualstudio.com/items?itemName=zero-plusplus.vscode-autohotkey-debug) by zero-plusplus

## Run This in Vim

For vim user, how to use this extension in vim.
1. Install coc.nvim.
2. Go to [vscode markertplace](https://marketplace.visualstudio.com/items?itemName=helsmy.ahk-simple-ls) to download the vsix file of this extension.
3. Use 7-zip or other unzip software to unzip the vsix.
4. Open `coc-settings.json` by `:CocConfig`. Add this configuration to your coc configuration file:
```json
"languageserver": {
  "Autohotkey": {
    "module": "your-unzip-dir/extension/server/out/server.js",
    "args": ["--node-ipc"],
    "filetypes": ["autohotkey"],
    "trace.server": "off",
    "documentLanguage": "no"
  }
}
```
5. restart vim, and open an ahk file.
6. Besides, coc.nvim may need a little configuration. Those can be find in the homepage of coc.nvim.

## Feature

* Color Syntax(1.1.32 version)
* Comment blocks
* Snippets
* Code Completion
* Document symbol(class, method, variable, label, hotkey) 
* Goto Definition
* Signature Helper (tooltip for method parameters)
* Enumerate include documents
  * The documents must be explicitly included by `#include`
* Folding region commnet
  * mark region start by `;[region]`
  * mark region end by   `;[endregion]`


## Settings

1. Autohotkey Language Server: Document Language  
   Language of documents of built-in variables and fucntions.  
   Only Chinese documents of built-in variables(Option: CN) available now
2. Autohotkey Language Server>Trace: Server  
   Traces the communication between VS Code and the language server.

## Preveiw

### Code Completion

![](pic/completion.png)

### Signature Help

![](pic/signature.png)

### Format Document

![](pic/format.png)

### Folding Region

![](pic/folding.gif)

## Further Plan

* [x] Language server
* [ ] Build-in Function hint
  * [x] Build-in Variable hint(Need Docs)
  * [x] Function hint(Need Docs)
* [x] Better syntax tree
* [x] Code formation
  * [ ] improvement needed
* [x] Enumerate include
  * [ ] Document cache improvement needed 
* [ ] Function debounce 
* [ ] Syntax analyze based parser  
* [ ] Enable documentation markdown

## Thanks

1. vinnyjames
2. stef-levesque
3. denolfe
4. Microsoft lsp-simple
5. jonnyboyC el. (kos-langeuage-sever)
6. bitwiseman(js-beautify)
7. 天黑请闭眼(modify js-beautify for ahk)

