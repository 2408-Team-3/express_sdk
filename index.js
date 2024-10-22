const axios = require('axios');

class ErrorSDK {
  constructor(projectID) {
    this.APIendpoint = 'http://localhost:8000';
    this.projectID = projectID; // TODO: needs to be generated and given to the user
    // this.releaseVersion = releaseVersion;
    this.#init();
  }

  setUpExpressErrorHandler(app) {
    app.use((e, req, res, next) => {

      console.log('[error sdk] from SDK middleware:');
      console.log('[error sdk] req object props:', Object.getOwnPropertyNames(req));
      console.log('[error sdk] e object props:', Object.getOwnPropertyNames(e));

      // ? Difference req.url vs req.originalURL? What is req.statusCode?

      const errorData = this.#processError(e);
      const requestData = this.#processRequest(req);
      this.#logError(errorData, requestData);
      next(e); // Optional
    });
  }

  captureException(e) {
    const errorData = this.#processError(e);
    this.#logError(errorData);

    next(e); // ? Optional
  }

  // * --- Private Methods --- * //
  #init() {
    // These two are for errors that escape Express' error handling system 
    // (i.e. synchronous errors inside routes)
    process.on('uncaughtException', (e) => this.#handleUncaughtException(e));
    process.on('unhandledRejection', (e) => this.#handleUnhandledRejecetion(e));
  }

  #handleUncaughtException(e) {
    console.log('[error sdk] unhandledException:');
    console.log('[error sdk]', e);
    console.log('[error sdk] e object props:', Object.getOwnPropertyNames(e));

    const errorData = this.#processError(e);
    this.#logError(errorData);
    process.exit(1);
  }

  #handleUnhandledRejecetion(e) {
    console.log('[error sdk] from unhandledRejection:');
    
    if (e instanceof Error) {
      console.log('[error sdk]', e);
      console.log('[error sdk] e object props:', Object.getOwnPropertyNames(e));

      const errorData = this.#processError(e);
      this.#logError(errorData);
    } else {
      console.log('[error sdk] rejected value:', e);
    }

    process.exit(1);
  }

  #processError(e) {
    return {
      message: e.message,
      stack: e.stack,
      time: new Date().toISOString(),
    }
  }

  #processRequest(req) {
    return {
      url: req.url,
      method: req.method,
      params: req.params,
      query: req.query,
    }
  }

  async #logError(errorData, requestData = {}) {
    const data = { error: errorData, req: requestData }
    console.log('[error sdk] Sending error to backend...');
    const response = await axios.post(`${this.APIendpoint}/api/errors`, data);
    console.log('[error sdk]', response.status, response.data.message );
  }
}

module.exports = ErrorSDK;