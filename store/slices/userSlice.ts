import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/config/api";
import type { User, UserRole } from "@/config/api";
import { getApiErrorMessage } from "@/config/api/client";
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
  currentRequestId: string | null;
  activeSearch: string;
  activeQueryKey: string | null;
}

const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
  promotionLoadingIds: [],
  currentRequestId: null,
  activeSearch: "",
  activeQueryKey: null,
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
  async (
    {
      page,
      limit = 20,
      role,
      isApproved,
      search,
    }: {
      page?: number;
      limit?: number;
      role?: UserRole | UserRole[];
      isApproved?: boolean;
      search?: string;
    } = {},
    { signal },
  ) => {
    // The backend search is combined with the page's role/status filter by
    // loading every search match and applying that existing filter.
    if (role === undefined && isApproved === undefined) {
      return api.getUsers(page ?? 1, limit, search, signal);
    }

    const pageSize = 100;
    const firstPage = await api.getUsers(1, pageSize, search, signal);
    const totalPages = Number(firstPage.pagination?.pages);
    if (!Number.isInteger(totalPages) || totalPages < 1) {
      throw new Error("Unable to load users because pagination data is invalid.");
    }

    const allUsers = [...firstPage.users];
    for (
      let firstPageNumber = 2;
      firstPageNumber <= totalPages;
      firstPageNumber += 5
    ) {
      const pageNumbers = Array.from(
        {
          length: Math.min(5, totalPages - firstPageNumber + 1),
        },
        (_, index) => firstPageNumber + index,
      );
      const pages = await Promise.all(
        pageNumbers.map((pageNumber) =>
          api.getUsers(pageNumber, pageSize, search, signal),
        ),
      );
      allUsers.push(...pages.flatMap((result) => result.users));
    }

    const roles = role === undefined ? null : [role].flat();
    const matchingUsers = allUsers.filter(
      (user) =>
        (roles === null || roles.includes(user.role)) &&
        (isApproved === undefined || user.isApproved === isApproved),
    );
    const matchingPages = Math.max(1, Math.ceil(matchingUsers.length / limit));

    if (page === undefined) {
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
    }

    const currentPage = Math.min(Math.max(page, 1), matchingPages);
    return {
      users: matchingUsers.slice((currentPage - 1) * limit, currentPage * limit),
      pagination: {
        page: currentPage,
        limit,
        total: matchingUsers.length,
        pages: matchingPages,
        hasNextPage: currentPage < matchingPages,
        hasPrevPage: currentPage > 1,
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
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to delete user"),
      );
    }
  },
);

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state, action) => {
        const search = action.meta.arg?.search ?? "";
        const role = action.meta.arg?.role;
        const queryKey = JSON.stringify({
          page: action.meta.arg?.page ?? 1,
          limit: action.meta.arg?.limit ?? 20,
          role: Array.isArray(role) ? [...role].sort() : role,
          isApproved: action.meta.arg?.isApproved,
          search: search.trim(),
        });
        state.loading = true;
        state.error = null;
        state.currentRequestId = action.meta.requestId;
        if (queryKey !== state.activeQueryKey) {
          state.users = [];
          state.activeSearch = search;
          state.activeQueryKey = queryKey;
        }
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        if (!action.meta.aborted) {
          state.error = action.error.message || "Failed to fetch users";
          toast.error("Failed to fetch users");
        }
      })

      .addCase(approveUser.pending, (state) => {
        state.error = null;
      })
      .addCase(approveUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) state.users[index] = action.payload;
        toast.success("User approved successfully");
      })
      .addCase(approveUser.rejected, (state, action) => {
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
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
        state.pagination.total -= 1;
        toast.success("User deleted successfully");
      })
      .addCase(deleteUser.rejected, (state, action) => {
        const message =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to delete user";
        state.error = message;
        toast.error(message);
      });
  },
});

export default userSlice.reducer;
