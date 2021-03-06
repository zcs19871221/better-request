import http, { RequestOptions } from 'http';
import https from 'https';
import Param, { ParamOpt } from '..';
import initAgent, { getClient, InputAgent } from './initAgent';

interface NodeParamOpt extends ParamOpt {
  agent?: InputAgent;
  option?: RequestOptions;
}
type SupportProtocol = 'http:' | 'https:';
export default class NodeParam extends Param {
  private readonly agent: http.Agent | https.Agent;
  private readonly option: RequestOptions;
  constructor({
    url,
    path,
    search,
    method,
    header,
    timeout,
    agent,
    option = {},
  }: NodeParamOpt) {
    super({ url, path, search, method, header, timeout });
    this.agent = initAgent(<any>this.url.protocol, agent);
    this.option = option;
  }

  getAgent(): http.Agent | https.Agent {
    return this.agent;
  }

  getOption(): RequestOptions {
    return this.option;
  }

  client() {
    return getClient(<SupportProtocol>this.url.protocol);
  }
}
export { NodeParamOpt };
