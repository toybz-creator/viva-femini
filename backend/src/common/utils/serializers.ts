import { Types } from 'mongoose';

function stringifyId(value: unknown): string | undefined {
  if (value instanceof Types.ObjectId) return value.toHexString();
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toString' in value) {
    const id = value.toString();
    return id === '[object Object]' ? undefined : id;
  }
  return undefined;
}

export function serializeMongoRecord<T extends object>(
  record: T,
): T & { id: string } {
  const recordLike = record as Record<string, unknown>;
  const id = stringifyId(recordLike._id) ?? stringifyId(recordLike.id) ?? '';
  const { _id, __v, ...rest } = recordLike;
  return { ...rest, id } as T & { id: string };
}

export function serializeMongoRecords<T extends object>(
  records: T[],
): Array<T & { id: string }> {
  return records.map((record) => serializeMongoRecord(record));
}
