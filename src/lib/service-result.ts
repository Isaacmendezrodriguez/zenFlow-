export type ServiceResult<T> = { data: T; error: null } | { data: null; error: string };

export function success<T>(data: T): ServiceResult<T> {
  return { data, error: null };
}

export function failure<T = never>(error: unknown): ServiceResult<T> {
  if (error instanceof Error) return { data: null, error: error.message };
  if (typeof error === "string") return { data: null, error };
  return { data: null, error: "Ocurrio un error inesperado." };
}
