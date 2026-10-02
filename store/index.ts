// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import productReducer from "./slices/productSlice";
import categoryReducer from "./slices/categorySlice";
import orderReducer from "./slices/orderSlice";
import salesReducer from "./slices/salesSlice";
import notificationReducer from "./slices/notificationSlice";
import trendingReducer from "./slices/trendingSlice";
import featuredReducer from "./slices/featuredSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    products: productReducer,
    categories: categoryReducer,
    orders: orderReducer,
    sales: salesReducer,
    notifications: notificationReducer,
    trending: trendingReducer,
    featured: featuredReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
