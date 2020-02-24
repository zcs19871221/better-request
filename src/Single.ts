import http from 'http';
import https from 'https';

import { AgentConfig } from './Param/node/initAgent';

export default class Single {
  static instance: Single | null = null;
  static getInstance() {
    if (Single.instance === null) {
      Single.instance = new Single();
    }
    return Single.instance;
  }
  private httpGlobalAgent: http.Agent | null = null;
  private httpsGlobalAgent: https.Agent | null = null;
  private constructor() {}

  getHttpGlobalAgent(
    config: AgentConfig = {
      keepAlive: true,
      keepAliveMsecs: 300,
      maxSockets: 100,
      maxFreeSockets: 20,
    },
  ) {
    if (this.httpGlobalAgent === null) {
      this.httpGlobalAgent = new http.Agent(config);
    }
    return this.httpGlobalAgent;
  }

  getHttpsGlobalAgent(
    config: AgentConfig = {
      keepAlive: true,
      keepAliveMsecs: 300,
      maxSockets: 100,
      maxFreeSockets: 20,
    },
  ) {
    if (this.httpsGlobalAgent === null) {
      this.httpsGlobalAgent = new https.Agent(config);
    }
    return this.httpsGlobalAgent;
  }
}
