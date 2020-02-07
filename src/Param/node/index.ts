import Param from '..';
import initAgent, { getClient } from './initAgent';
import initBody from './initBody';

export default class NodeParam extends Param {
  private readonly agent: AgentConfig;
  private body: NodeBody;
  constructor({
    url,
    path,
    search,
    method,
    header,
    timeout,
    body = null,
    agent,
  }: NodeParamOpt) {
    super({ url, path, search, method, header, timeout });
    this.agent = initAgent(this.url.protocol, agent);
    this.body = initBody(body, this.method, this.header.get('content-type'));
  }

  addContentLength(body: NodeBody): this {
    const propName = 'content-length';
    if (body === null) {
      this.header.set(propName, '0');
      return this;
    }
    this.header.set(propName, String(Buffer.byteLength(body)));
    return this;
  }

  getAgent(): AgentConfig {
    return this.agent;
  }

  client() {
    return getClient(this.url.protocol);
  }

  getBody(): NodeBody {
    return this.body;
  }
}
