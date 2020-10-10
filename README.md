# Visual Studio Code Autohotkey Simple Support

A personal edition modified from [vscode-autohotkey](https://github.com/vinnyjames/vscode-autohotkey)  
And Microsoft lsp-simple

AutoHotKey language support for VS Code

# What's New

1. Build-in Variable hint.
   - Need documentions which is easy to be parsed by js/ts. If you find any, help please.

## Notice

* This is a parser based on regular expression. The results are not guaranteed.

## Feature
* Color Syntax(1.1.32 version)
* Comment blocks
* Snippets
* Code Completion
* Doucment symbol(class, method, variable, label, hotkey) 
* Goto Definition(limited support)
* Signature Helper (tooltip for method parameters)

![](pic/completion.png)
![](pic/signature.png)

## Further Plan

* [x] Language server
* [ ] Build-in Function hint
  * [x] Build-in Variable hint(Need Docs)
* [x] Better syntax tree
* [ ] Enumerate include 
* [ ] Function debounce 
* [ ] Syntax analyze based parser  
* [ ] Enable documentation markdown

## Thanks

1. vinnyjames
2. stef-levesque
3. denolfe
4. Microsoft lsp-simple

