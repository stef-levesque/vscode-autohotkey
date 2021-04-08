/**
 * Maybe type for things that might be undefined
 */
type Maybe<T> = T | undefined;

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