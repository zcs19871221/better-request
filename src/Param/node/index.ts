import http from 'http';
import https from 'https';
import Param, { ParamOpt } from '..';
import initAgent, { getClient, InputAgent } from './initAgent';

interface NodeParamOpt extends ParamOpt {
  agent?: InputAgent;
}
type SupportProtocol = 'http:' | 'https:';
export default class NodeParam extends Param {
  private readonly agent: http.Agent | https.Agent;
  constructor({
    url,
    path,
    search,
    method,
    header,
    timeout,
    agent,
  }: NodeParamOpt) {
    super({ url, path, search, method, header, timeout });
    this.agent = initAgent(<any>this.url.protocol, agent);
  }

  getAgent(): http.Agent | https.Agent {
    return this.agent;
  }

  client() {
    return getClient(<SupportProtocol>this.url.protocol);
  }
}
export { NodeParamOpt };
