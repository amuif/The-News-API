export function baseResponse(
  success: boolean,
  message: string,
  object: any = null,
  errors: string[] | null = null
) {
  return {
    Success: success,
    Message: message,
    Object: object,
    Errors: errors,
  }
}