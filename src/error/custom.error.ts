export class CustomError extends Error {
  constructor(props: { message: string; prop: string }) {
    super(props.message);

    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
