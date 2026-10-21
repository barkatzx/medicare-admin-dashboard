import type { OrderedProduct } from "@/config/api";

const missingCompany = Symbol("missing-company");

export function orderShipmentProductsByCompany(
  products: OrderedProduct[],
): OrderedProduct[] {
  const productsByCompany = new Map<string | symbol, OrderedProduct[]>();

  for (const product of products) {
    const companyId = product.category?.id.trim();
    const companyName = product.category?.name.trim();
    const companyKey = companyId
      ? `id:${companyId}`
      : companyName
        ? `name:${companyName.toLowerCase()}`
        : missingCompany;
    const companyProducts = productsByCompany.get(companyKey);

    if (companyProducts) {
      companyProducts.push(product);
    } else {
      productsByCompany.set(companyKey, [product]);
    }
  }

  return Array.from(productsByCompany.values()).flat();
}
