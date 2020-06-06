import Controller from '.';

interface ResponseHandler {
  (response: any, controller: any): Promise<any>;
}
const checkStatusCode: ResponseHandler = (
  response: any,
  controller: Controller<any>,
): any => {
  const statusCode = controller.fetcher.statusCode;
  const statusFilter = controller.getStatusFilter();
  if (!statusFilter.test(String(statusCode))) {
    throw new Error(
      `status code ${statusCode} not match regExp ${statusFilter.source}`,
    );
  }
  return response;
};

const parseJson: ResponseHandler = (
  response: any,
  controller: Controller<any>,
) => {
  const contentType = controller.fetcher.getResHeader('content-type');
  if (contentType.includes('application/json')) {
    return JSON.parse(response);
  }
};
export { ResponseHandler, checkStatusCode, parseJson };
