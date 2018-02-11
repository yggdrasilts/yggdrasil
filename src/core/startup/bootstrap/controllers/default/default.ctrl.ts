import {
	Request,
	Response
} from '../../../../../mvc';
import {
	FileLogger
} from '../../../../../core';

export class DefaultCtrl {

	/** BasicCtrl logger */
	private logger: FileLogger;

	/** Apps home */
	private appHome: string;

	/** Default constructor */
	constructor(appHome?: string) {
		this.logger = new FileLogger(DefaultCtrl.name);
		this.appHome = appHome;
	}

	/**
	 * Gets default yggdrasil page
	 */
	public getDefault = (req: Request, res: Response) => {
		this.logger.debug(`show default yggdrasil page`);

		res.sendFile(__dirname + '/defaultHtml/default.html');
	}

	/**
	 * Redirects to application home page
	 */
	public redirectToAppHome = (req: Request, res: Response) => {
		this.logger.debug(`redirects to application home`);

		res.redirect(this.appHome);
	}

}
