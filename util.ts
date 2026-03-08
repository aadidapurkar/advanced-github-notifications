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


export const getSetSyntaxSQL = (columns : string[]) : string => {
    return columns.map(f => `${f} = ?`)
    .join(', ');
} 