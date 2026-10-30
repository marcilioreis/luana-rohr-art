import { configureStore, isPlain } from "@reduxjs/toolkit";
import { api } from "../lib/api";
import { rtkQueryErrorLogger } from "../lib/errorMiddleware";
import authReducer from "../features/auth/authSlice";
import cartReducer from "../features/cart/cartSlice";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        isSerializable: (value: unknown) => {
          if (value instanceof Date) return true;
          return isPlain(value);
        },
      },
    })
      .concat(api.middleware)
      .concat(rtkQueryErrorLogger),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
