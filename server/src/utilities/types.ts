/**
 * Maybe type for things that might be undefined
 * ref: vscode-kos-language-server
 */
type Maybe<T> = T | undefined;

/**
 * The type to restrict the type to constructor functions
 * or classes
 * ref: vscode-kos-language-server
 */
 type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Base logger interface, mirror vscodes logger
 * ref: vscode-kos-language-server
 */
interface ILoggerBase {
    error(message: string): void;
    warn(message: string): void;
    info(message: string): void;
    log(message: string): void;
  }