import { ResponseCode } from "./responseCode";

export class ApiResponse<T> {
  status: ResponseCode;
  message: string;
  data: T | null;
  error: string | null;
}
