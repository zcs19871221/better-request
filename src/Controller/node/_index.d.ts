declare interface NodeControllerOpt extends ControllerOpt {
  readonly redirect?: boolean;
  readonly maxRedirect?: number;
}
