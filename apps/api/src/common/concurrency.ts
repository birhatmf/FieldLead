export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Map<number, R>();
  let cursor = 0;

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        results.set(index, await mapper(items[index], index));
      }
    },
  );

  await Promise.all(workers);

  return [...results.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, value]) => value);
}
