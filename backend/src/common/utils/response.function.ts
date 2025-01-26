import { ResponseDto } from 'src/common/dtos/response.dto';

export function successResponse<T>(
  data: T,
  message = 'Success',
): ResponseDto<T> {
  return new ResponseDto(200, message, data);
}

export function errorResponse(
  message: string,
  error: string,
  statusCode = 400,
): ResponseDto<null> {
  return new ResponseDto(statusCode, message, null, error);
}
