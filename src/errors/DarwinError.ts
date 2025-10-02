export class DarwinError extends Error {
  statusCode: number | null;
  statusText: string | null;
  body: string | null;

  constructor(
    message: string,
    statusCode: number | null = null,
    statusText: string | null = null,
    body: string | null = null,
  ) {
    super(message);
    this.name = "DarwinError";
    this.statusCode = statusCode;
    this.statusText = statusText;
    this.body = body;

    Object.setPrototypeOf(this, DarwinError.prototype);
  }
}
