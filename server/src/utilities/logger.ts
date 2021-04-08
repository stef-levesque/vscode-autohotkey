/**
 * Simple Logger, reference: kos-language-server
 */
export class Logger implements ILoggerBase {
	constructor(
		private readonly connection: ILoggerBase
	) { }

	error(message: string) {
		this.connection.warn(message);
	}

	warn(message: string) {
		this.connection.warn(message);

	}

	log(message: string) {
		this.connection.log(message);

	}

	info(message: string) {
		this.connection.info(message);

	}
}

/**
 * A mock logger for testings or performance
 * reference: kos-language-server
 */
 export const mockLogger: ILoggerBase = {
	error: (_: string) => {},
	warn: (_: string) => {},
	info: (_: string) => {},
	log: (_: string) => {}
};
  