import Controller from '.';

interface BodyHandler {
  (body: any, controller: any): [any, any];
}
interface BodyHandlerFactory {
  json(): BodyHandler;
  urlencoded(): BodyHandler;
  formData(): BodyHandler;
  calLength(): BodyHandler;
}

abstract class BodyHandlerImpl implements BodyHandlerFactory {
  format() {}
}

class NodeBodyHandler extends BodyHandlerImpl {
  json() {}
  urlencoded() {}
  formData() {}
}
