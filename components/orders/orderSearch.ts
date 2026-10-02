export function isFullOrderId(value: string): boolean {
  return (
    /^[a-f\d]{12}$/i.test(value) ||
    /^[a-f\d]{24}$/i.test(value) ||
    /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(value)
  );
}
