// src/store/slices/authSlice.ts
import { api, User } from "@/config/api";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import toast from "react-hot-toast";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  isInitialized: false,
};

// Helper function to load initial state from localStorage
const loadInitialState = (): AuthState => {
  if (typeof window === "undefined") {
    return initialState;
  }

  try {
    const token =
      localStorage.getItem("adminToken") || localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      const user = JSON.parse(userStr);
      // Verify user is still admin and approved
      if (user.role === "admin" && user.isApproved) {
        return {
          ...initialState,
          user,
          token,
          isAuthenticated: true,
          isInitialized: true,
        };
      }
    }
  } catch (error) {
    console.error("Error loading auth state:", error);
  }

  return { ...initialState, isInitialized: true };
};

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }) => {
    const response = await api.login(email, password);
    return response;
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  api.clearToken();
  return null;
});

// Thunk to check and restore session on app load
export const checkAuthStatus = createAsyncThunk(
  "auth/checkStatus",
  async () => {
    if (typeof window === "undefined") return null;

    const token =
      localStorage.getItem("adminToken") || localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) return null;

    try {
      const user = JSON.parse(userStr);
      // Verify user is admin and approved
      if (user.role === "admin" && user.isApproved) {
        return { user, token };
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }

    return null;
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: loadInitialState(), // Load initial state from localStorage
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        toast.success("Login successful!");
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.error.message || "Login failed");
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        toast.success("Logged out successfully");
      })
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        }
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.loading = false;
        state.isInitialized = true;
      });
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
