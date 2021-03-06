import { ResponseHandler } from '../response_handlers';
import NodeFetcher from '../../Fetcher/node';
import NodeParam from '../../Param/node';
import NodeController from '.';
import Controller from '..';

const redirect: ResponseHandler = (
  res: any,
  ctr: Controller<any>,
  jumpOut: () => void,
): Promise<any> => {
  const controller = <NodeController>ctr;
  if (
    controller.getMaxRedirect() > 0 &&
    controller.fetcher.is3xx() &&
    controller.fetcher.getResHeader('location')
  ) {
    if (controller.getRediectTimes() < controller.getMaxRedirect()) {
      const param = new NodeParam({
        url: controller.fetcher.getResHeader('location'),
        method: 'GET',
        timeout: 5 * 1000,
      });
      controller.fetcher = new NodeFetcher(param);
      controller.param = param;
      controller.setRediectTimes(controller.getRediectTimes() + 1);
      jumpOut();
      return controller.ensureRequest(null);
    } else {
      throw new Error(`重定向超过${controller.getMaxRedirect()}次`);
    }
  }
  return res;
};
export default redirect;
