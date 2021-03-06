import * as winston from 'winston';
import { format } from 'winston';
import * as Transport from 'winston-transport';
import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment';

import { Tracking } from '../tracking';
import { Utils } from '../utils';

/** Log level enumeration */
export enum LEVEL {

	/**
	 * Shows log traces from trace to error. Recommended in development/test environments.
	 */
	TRACE = 'trace',

	/**
	 * Shows log traces from debug to error. Recommended in development/test environments.
	 */
	DEBUG = 'debug',

	/**
	 * Shows log traces from info to error. Recommended in production environments.
	 */
	INFO = 'info',

	/**
	 * Shows log traces from warn to error.
	 */
	WARN = 'warn',

	/**
	 * Shows log traces only for error.
	 */
	ERROR = 'error',

	/**
	 * Shows log traces for fatal.
	 */
	FATAL = 'fatal'

}

/**
 * Description
 * ===========
 *
 * Gives log functionality to the server. It is useful to follow the server application in a production environment because
 * it creates a file log into {installationPath}/logs/server.log with all the log traces created into it. Also, it creates
 * a {installationPath}/logs/exception.log with the exceptions ocurred in the server application.
 *
 * Dependencies
 * ============
 * This module use some dependencies:
 * process params
 * --------------
 * - __process.env.FILELOGGER_LOG_LEVEL__: param to configure log level. See {@link LEVEL} to know the values for this param.
 */
export class YGLoggerSingleton {

	/** Contains the application log name. */
	private static FILELOGGER_LOG_NAME = 'server.log';

	/** Contains the exception log name. */
	private static FILELOGGER_EXCEPTION_LOG_NAME = 'exception.log';

	/** Logger */
	private static logger: YGLoggerSingleton;

	/** LoggerOptions */
	private static loggerOptions: winston.LoggerOptions;

	/** Container for the logger */
	private container: winston.Container;

	/** Default level */
	private level = 'debug';

	private YGLevels = {
		fatal: 0,
		error: 1,
		warn: 2,
		info: 3,
		debug: 4,
		trace: 5
	};

	/**
	 * Default constructor.
	 */
	constructor() {
		if (!fs.existsSync(path.join(Utils.appLogsPath))) {
			// Create the directory if it does not exist
			fs.mkdirSync(path.join(Utils.appLogsPath));
		}

		if (process.env.FILELOGGER_LOG_LEVEL != null) {
			this.level = process.env.FILELOGGER_LOG_LEVEL;
		}

		const defaultTransports: Transport[] = [
			new(winston.transports.Console)({
				format: format.simple(),
				level: this.level
			}),
			new(winston.transports.File)({
				format: format.json(),
				filename: path.join(Utils.appLogsPath, YGLoggerSingleton.FILELOGGER_LOG_NAME),
				level: this.level
			})
		];
		YGLoggerSingleton.loggerOptions = {
			levels: this.YGLevels,
			transports: defaultTransports,
			exceptionHandlers: [
				new(winston.transports.File)({
					filename: path.join(Utils.appLogsPath, YGLoggerSingleton.FILELOGGER_EXCEPTION_LOG_NAME)
				})
			]
		};
		this.container = new winston.Container(YGLoggerSingleton.loggerOptions);
	}

	/**
	 * Gets Logger instance
	 */
	public static getInstance(sourceModule: string): YGLoggerSingleton {
		if (!YGLoggerSingleton.logger) {
			YGLoggerSingleton.logger = new YGLoggerSingleton();
		}
		if (!YGLoggerSingleton.logger.container.get(sourceModule)) {
			YGLoggerSingleton.logger.container.add(sourceModule, YGLoggerSingleton.loggerOptions);
		}
		return YGLoggerSingleton.logger;
	}

	/**
	 * Print log trace.
	 *
	 * Log trace format: '[trackingId][date(UTC)][class][...message]'
	 *
	 * @param  {LEVEL} level Enum with log level
	 * @param  {string} source From where is the message.
	 * @param  {string} message Message to print.
	 * @param  {any} params Other objects to print.
	 */
	public log(level: LEVEL, source: string, message: string, ...params: any[]): void {
		if (process.env.NODE_ENV !== 'test' || process.env.ENABLE_LOG === 'true') {
			const log = `[${Tracking.trackingId || '#'}][${moment().format('DD/MM/YYYY-HH:mm:ss.SSSZ')}][${Utils.capitalize(source)}] - ${message}`;

			if (this.hasParams()) {
				this.container.get(source).log(level, log, params);
			} else {
				this.container.get(source).log(level, log);
			}
		}
	}

	/**
	 * Checks if params is empty
	 * @param {any} params Object array.
	 */
	private hasParams(...params: any[]): boolean {
		return params !== undefined &&
				params.length > 0 &&
				Array.isArray(params[0]) &&
				(params[0].length > 0);
	}
}
