import http from 'http';
import https from 'https';
import Single from '../../Single';
declare interface AgentConfig {
  keepAlive: boolean;
  maxSockets: number;
  maxFreeSockets: number;
  keepAliveMsecs: number;
}

declare type InputAgent = http.Agent | https.Agent | AgentConfig;

const PROTOCOL_MAP_MODULE = {
  'http:': http,
  'https:': https,
};

const getClient: (
  protocol: keyof typeof PROTOCOL_MAP_MODULE,
) => any = protocol => {
  return (PROTOCOL_MAP_MODULE as any)[protocol];
};

function initAgent(
  protocol: 'http:',
  agent?: http.Agent | AgentConfig,
): http.Agent;
function initAgent(
  protocol: 'https:',
  agent?: https.Agent | AgentConfig,
): https.Agent;
function initAgent(protocol: any, agent: any): any {
  if (!agent) {
    const single = Single.getInstance();
    if (protocol === 'http:') {
      return single.getHttpGlobalAgent();
    }
    if (protocol === 'https:') {
      return single.getHttpsGlobalAgent();
    }
  }
  if (agent instanceof http.Agent || agent instanceof https.Agent) {
    return agent;
  }
  const client = getClient(protocol);
  return new client.Agent(agent);
}
export default initAgent;
export { getClient, InputAgent, AgentConfig };
