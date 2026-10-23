export interface ImageUploadFailure<T> {
  file: T;
  message: string;
}

export async function uploadImagesIndividually<T>(
  productId: string,
  images: readonly T[],
  alreadyUploaded: readonly T[],
  upload: (productId: string, image: T) => Promise<unknown>,
): Promise<{ uploaded: T[]; failures: ImageUploadFailure<T>[] }> {
  const uploaded = new Set(alreadyUploaded);
  const failures: ImageUploadFailure<T>[] = [];

  for (const image of images) {
    if (uploaded.has(image)) continue;

    try {
      await upload(productId, image);
      uploaded.add(image);
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : error instanceof Error
            ? error.message
            : "Upload failed";
      failures.push({
        file: image,
        message,
      });
    }
  }

  return {
    uploaded: images.filter((image) => uploaded.has(image)),
    failures,
  };
}
