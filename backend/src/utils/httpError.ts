import { errors, ErrorCode, FieldError } from "./errors";

// Expected errors carry a reviewed public code, not an arbitrary exception message.
export class HttpError extends Error {
  public status: number;
  public code: ErrorCode;
  public fields: FieldError[];

  constructor(code: ErrorCode, fields: FieldError[] = []) {
    super(errors[code].message);
    this.name = "HttpError";
    this.code = code;
    this.status = errors[code].status;
    this.fields = fields;
  }
}
