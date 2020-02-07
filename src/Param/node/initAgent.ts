import http from 'http';
import https from 'https';

const PROTOCOL_MAP_MODULE = {
  'http:': http,
  'https:': https,
};

const config: AgentConfig = {
  keepAlive: true,
  maxSockets: 200,
  maxFreeSockets: 10,
  keepAliveMsecs: 300,
};

const defaultAgent = {
  'http:': new http.Agent(config),
  'https:': new https.Agent(config),
};

const getClient: (protocol: string) => any = protocol => {
  return (PROTOCOL_MAP_MODULE as any)[protocol];
};
const initAgent: (protocol: string, agent?: AgentConfig) => AgentConfig = (
  protocol,
  agent,
) => {
  if (!agent) {
    return (defaultAgent as any)[protocol];
  }
  if (agent instanceof http.Agent || agent instanceof https.Agent) {
    return agent;
  }
  const client = getClient(protocol);
  return new client.Agent(agent);
};
export default initAgent;
export { getClient };
