import http from 'http';
import initAgent, { AgentConfig } from './initAgent';
import Single from '../../Single';

it('initAgent', () => {
  expect(initAgent('http:')).toBe(Single.getInstance().getHttpGlobalAgent());
  const inputAgent = new http.Agent();
  expect(initAgent('http:', inputAgent) === inputAgent).toBe(true);
  const config: AgentConfig = {
    keepAliveMsecs: 300,
    maxFreeSockets: 20,
    maxSockets: 30,
    keepAlive: false,
  };
  const agent = initAgent('http:', config);
  const { keepAlive, keepAliveMsecs, maxFreeSockets, maxSockets } = <any>agent;
  expect({ keepAlive, keepAliveMsecs, maxFreeSockets, maxSockets }).toEqual({
    keepAliveMsecs: 300,
    maxFreeSockets: 20,
    maxSockets: 30,
    keepAlive: false,
  });
});
