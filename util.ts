/**
 * A Result tuple where:
 * Success: [null, T]
 * Failure: [Error, null]
 */
export type Result<T> = [null, T] | [Error, null];

export const handle = async <T>(promise: Promise<T>): Promise<Result<T>> => {
  try {
    const data = await promise;
    return [null, data];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return [err, null];
  }
};


export const setSyntaxSQL = (columns : string[]) : string => {
    return columns.map(f => `${f} = ?`)
    .join(', ');
} 

export const addSyntaxSql = (columns: string[]) : string => {
  return columns.join(", ")
}
export const getValueSyntax = <T>(values : T[]) : string => {
  return values.map(_ => "?").join(', ');
}

export function printNonNull<T extends object>(obj: T): void {
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      console.log(`${key}:`, value);
    }
  });
}