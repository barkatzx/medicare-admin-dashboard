import assert from "node:assert/strict";
import test from "node:test";
import salesReducer, { fetchSalesData } from "../store/slices/salesSlice";

test("ignores stale sales responses without clearing another period's loading state", () => {
  let state = salesReducer(undefined, { type: "test/initialize" });

  state = salesReducer(
    state,
    fetchSalesData.pending("weekly-old", "weekly"),
  );
  state = salesReducer(
    state,
    fetchSalesData.pending("weekly-current", "weekly"),
  );
  state = salesReducer(
    state,
    fetchSalesData.pending("monthly-current", "monthly"),
  );

  state = salesReducer(
    state,
    fetchSalesData.fulfilled(
      {
        period: "weekly",
        data: [
          {
            label: "old",
            sales: 1,
            orders: 1,
            avgOrderValue: 1,
            itemsSold: 1,
          },
        ],
      },
      "weekly-old",
      "weekly",
    ),
  );
  assert.equal(state.salesData.weekly, null);
  assert.equal(state.loadingByPeriod.weekly, true);
  assert.equal(state.loading, true);

  state = salesReducer(
    state,
    fetchSalesData.fulfilled(
      {
        period: "weekly",
        data: [
          {
            label: "current",
            sales: 10,
            orders: 2,
            avgOrderValue: 5,
            itemsSold: 3,
          },
        ],
      },
      "weekly-current",
      "weekly",
    ),
  );
  assert.equal(state.salesData.weekly?.[0]?.label, "current");
  assert.equal(state.loadingByPeriod.weekly, false);
  assert.equal(state.loadingByPeriod.monthly, true);
  assert.equal(state.loading, true);
});
