const axios = require('axios');

class ErrorMonitor {
  // static #APIendpoint = 'http://localhost:8000'; // Change to where the lambda runs
  static #APIendpoint = 'https://jvcrh631c5.execute-api.us-east-1.amazonaws.com/dev'

  constructor(projectID) {
    this.projectID = projectID; // TODO: needs to be generated and given to the user
    // this.releaseVersion = releaseVersion;
    process.on('uncaughtException', (e) => this.#handleUncaughtException(e));
    // process.on('unhandledRejection', (e) => this.#handleUnhandledRejection(e));
  }

  setUpExpressErrorHandler(app) {
    app.use((e, req, res, next) => {
      this.#logError(e, false);
      next(e);
    });
  }

  captureException(e) {
    this.#logError(e, true);
    next(e); // ???
  }

  // * --- Private Methods --- * //
  #handleUncaughtException(e) {
    this.#logError(e, false);
    process.exit(1);
  }

  // #handleUnhandledRejection(e) {
  //   console.log('[error sdk] from unhandledRejection:');
    
  //   if (e instanceof Error) {
  //     console.log('[error sdk]', e);
  //     console.log('[error sdk] e object props:', Object.getOwnPropertyNames(e));

  //     this.#logError(e, 'unhandled');
  //   } else {
  //     console.log('[error sdk] rejected value:', e);
  //   }

  //   process.exit(1);
  // }

  async #logError(error, handled) {
    const data = { 
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      handled,
      timestamp: new Date().toISOString(),
      project_id: this.projectID,
    }

    try {
      console.log('[error sdk] Sending error to backend...');
      const response = await axios.post(`${ErrorMonitor.#APIendpoint}/api/errors`, { data });
      console.log('[error sdk]', response.status, response.data.message);
    } catch (e) {
      console.error('[error sdk] An error occurred sending error to the backend:');
      console.error(e);
    }
  }
}

module.exports = ErrorMonitor;