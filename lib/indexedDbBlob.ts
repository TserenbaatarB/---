export type IndexedDbBlobRecord = {
  __invitationBlobRecord: true;
  bytes: ArrayBuffer;
  type: string;
};

export function toIndexedDbBlob(value: unknown): Blob | null {
  if (value instanceof Blob) {
    return value;
  }

  if (
    typeof value !== "object" ||
    value === null ||
    !("__invitationBlobRecord" in value) ||
    value.__invitationBlobRecord !== true ||
    !("bytes" in value) ||
    !(value.bytes instanceof ArrayBuffer) ||
    !("type" in value) ||
    typeof value.type !== "string"
  ) {
    return null;
  }

  return new Blob([value.bytes], { type: value.type });
}

export function isIndexedDbBlobCloneError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "DataCloneError" || error.name === "UnknownError")
  );
}

export async function toIndexedDbBlobRecord(
  blob: Blob
): Promise<IndexedDbBlobRecord> {
  return {
    __invitationBlobRecord: true,
    bytes: await blob.arrayBuffer(),
    type: blob.type,
  };
}
