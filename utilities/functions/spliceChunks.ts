export const spliceIntoChunks = <T>(
  arr: readonly T[],
  chunkSize: number
): T[][] => {
  const result: T[][] = [];
  const arrCopy = [...arr];
  while (arrCopy.length > 0) result.push(arrCopy.splice(0, chunkSize));
  return result;
};
