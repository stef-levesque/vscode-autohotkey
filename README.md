# Visual Studio Code Autohotkey Simple Support

A personal edition modified from [vscode-autohotkey](https://github.com/vinnyjames/vscode-autohotkey)  
And Microsoft lsp-simple

AutoHotKey language support for VS Code

## What's New

1. New configuration `documentLanguage`
   - Which lanuage document is shown for code completion hint
   - Only chinese document of build-in varible avaible now   
2. Build-in Variable and Function(partly) hint.
   - Need documentions which is easy to be parsed by js/ts. If you find any, help please.

## Notice

* This is a parser based on regular expression. The results are not guaranteed.
* If you need a debugger, just install any debug extension in market. As recommended options, [AutoHotKey Debug](https://marketplace.visualstudio.com/items?itemName=helsmy.autohotkey-debug) by me or [vscode-autohotkey-debug](https://marketplace.visualstudio.com/items?itemName=zero-plusplus.vscode-autohotkey-debug)

## Feature
* Color Syntax(1.1.32 version)
* Comment blocks
* Snippets
* Code Completion
* Document symbol(class, method, variable, label, hotkey) 
* Goto Definition(limited support)
* Signature Helper (tooltip for method parameters)

## Preveiw

### Code Completion

![](pic/completion.png)

### Signature Help

![](pic/signature.png)

## Further Plan

* [x] Language server
* [ ] Build-in Function hint
  * [x] Build-in Variable hint(Need Docs)
  * [x] Function hint(Need Docs)
* [x] Better syntax tree
* [x] Code formation
  * [ ] improvement needed
* [ ] Enumerate include 
* [ ] Function debounce 
* [ ] Syntax analyze based parser  
* [ ] Enable documentation markdown

## Thanks

1. vinnyjames
2. stef-levesque
3. denolfe
4. Microsoft lsp-simple
5. bitwiseman(js-beautify)
6. 天黑请闭眼(modify js-beautify for ahk)

