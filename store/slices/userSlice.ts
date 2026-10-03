import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/config/api";
import type { User, UserRole } from "@/config/api";
import toast from "react-hot-toast";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  promotionLoadingIds: string[];
  pagination: Pagination;
}

const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
  promotionLoadingIds: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async ({
    page = 1,
    limit = 20,
    role,
  }: { page?: number; limit?: number; role?: UserRole } = {}) => {
    if (!role) {
      return api.getUsers(page, limit);
    }

    const pageSize = 100;
    const firstPage = await api.getUsers(1, pageSize);
    const totalPages = Number(firstPage.pagination?.pages);
    if (!Number.isInteger(totalPages) || totalPages < 1) {
      throw new Error("Unable to load users because pagination data is invalid.");
    }

    const allUsers = [...firstPage.users];
    for (let firstPageNumber = 2; firstPageNumber <= totalPages; firstPageNumber += 5) {
      const pageNumbers = Array.from(
        {
          length: Math.min(5, totalPages - firstPageNumber + 1),
        },
        (_, index) => firstPageNumber + index,
      );
      const pages = await Promise.all(
        pageNumbers.map((pageNumber) => api.getUsers(pageNumber, pageSize)),
      );
      allUsers.push(...pages.flatMap((result) => result.users));
    }

    const matchingUsers = allUsers.filter((user) => user.role === role);
    const matchingPages = Math.max(1, Math.ceil(matchingUsers.length / limit));

    return {
      users: matchingUsers,
      pagination: {
        page: 1,
        limit,
        total: matchingUsers.length,
        pages: matchingPages,
        hasNextPage: matchingPages > 1,
        hasPrevPage: false,
      },
    };
  },
);

export const approveUser = createAsyncThunk(
  "users/approve",
  async (userId: string) => {
    const response = await api.approveUser(userId);
    return response;
  },
);

export const promoteUserToTSR = createAsyncThunk(
  "users/promoteToTSR",
  async (userId: string) => api.promoteUserToTSR(userId),
);

export const deleteUser = createAsyncThunk(
  "users/delete",
  async (userId: string, { rejectWithValue }) => {
    try {
      await api.deleteUser(userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete user");
    }
  },
);

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch users";
        toast.error("Failed to fetch users");
      })

      .addCase(approveUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) state.users[index] = action.payload;
        toast.success("User approved successfully");
      })
      .addCase(approveUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to approve user";
        toast.error("Failed to approve user");
      })

      .addCase(promoteUserToTSR.pending, (state, action) => {
        state.promotionLoadingIds.push(action.meta.arg);
      })
      .addCase(promoteUserToTSR.fulfilled, (state, action) => {
        state.promotionLoadingIds = state.promotionLoadingIds.filter(
          (userId) => userId !== action.payload.id,
        );
        const index = state.users.findIndex((user) => user.id === action.payload.id);
        if (index !== -1) state.users[index] = action.payload;
      })
      .addCase(promoteUserToTSR.rejected, (state, action) => {
        state.promotionLoadingIds = state.promotionLoadingIds.filter(
          (userId) => userId !== action.meta.arg,
        );
        state.error = action.error.message || "Failed to promote user to TSR";
      })

      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((u) => u.id !== action.payload);
        state.pagination.total -= 1;
        toast.success("User deleted successfully");
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to delete user";
        toast.error((action.payload as string) || "Failed to delete user");
      });
  },
});

export default userSlice.reducer;
