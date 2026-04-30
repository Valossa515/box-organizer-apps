/**
 * Envelope de resposta usado pelo backend (spring-courier).
 * Endpoints de comando podem retornar 204 sem corpo.
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
  statusCode: number;
}
