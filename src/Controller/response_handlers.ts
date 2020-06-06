import { Controllerr } from '.';

interface ResponseHandler {
  (response: any, controller: Controllerr<any>): any;
}

const statusCodeCheck: ResponseHandler = (response, controller): any => {
  const statusCode = controller.fetcher.statusCode;
  const statusFilter = controller.getStatusFilter();
  if (!statusFilter.test(String(statusCode))) {
    throw new Error(
      `status code ${statusCode} not match regExp ${statusFilter.source}`,
    );
  }
  return response;
};

export { ResponseHandler, statusCodeCheck };
