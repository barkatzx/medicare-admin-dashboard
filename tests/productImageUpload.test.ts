import assert from "node:assert/strict";
import { test } from "node:test";
import { uploadImagesIndividually } from "../components/products/productImageUpload";

test("keeps confirmed uploads and returns failed images for retry", async () => {
  const files = ["front.png", "side.png", "back.png"];
  const calls: string[] = [];

  const firstAttempt = await uploadImagesIndividually(
    "product-1",
    files,
    [],
    async (productId, file) => {
      assert.equal(productId, "product-1");
      calls.push(file);
      if (file === "side.png") throw new Error("Network unavailable");
    },
  );

  assert.deepEqual(firstAttempt.uploaded, ["front.png", "back.png"]);
  assert.deepEqual(firstAttempt.failures, [
    { file: "side.png", message: "Network unavailable" },
  ]);

  const retry = await uploadImagesIndividually(
    "product-1",
    files,
    firstAttempt.uploaded,
    async (_productId, file) => {
      calls.push(file);
    },
  );

  assert.deepEqual(retry.uploaded, files);
  assert.deepEqual(retry.failures, []);
  assert.deepEqual(calls, ["front.png", "side.png", "back.png", "side.png"]);
});
