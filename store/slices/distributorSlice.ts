import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, type Distributor } from "@/config/api";
import toast from "react-hot-toast";

interface DistributorState {
  distributors: Distributor[];
  loading: boolean;
  error: string | null;
}

const initialState: DistributorState = {
  distributors: [],
  loading: false,
  error: null,
};

export const fetchDistributors = createAsyncThunk(
  "distributors/fetchAll",
  async () => {
    const response = await api.getAllDistributor();
    return response;
  },
);

export const createDistributor = createAsyncThunk(
  "distributors/create",
  async ({ name }: { name: string }) => {
    const response = await api.createDistributor(name);
    return response;
  },
);

export const updateDistributor = createAsyncThunk(
  "distributors/update",
  async ({ id, name }: { id: string; name: string }) => {
    const response = await api.updateDistributor(id, name);
    return response;
  },
);

export const deleteDistributor = createAsyncThunk(
  "distributors/delete",
  async (id: string) => {
    await api.deleteDistributor(id);
    return id;
  },
);

const distributorSlice = createSlice({
  name: "distributors",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDistributors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDistributors.fulfilled, (state, action) => {
        state.loading = false;
        state.distributors = action.payload;
      })
      .addCase(fetchDistributors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch distributors";
        toast.error("Failed to fetch distributors");
      })
      .addCase(createDistributor.fulfilled, (state, action) => {
        state.distributors.push(action.payload);
        toast.success("Distributor created successfully");
      })
      .addCase(createDistributor.rejected, (state, action) => {
        toast.error(action.error.message || "Failed to create distributor");
      })
      .addCase(updateDistributor.fulfilled, (state, action) => {
        const index = state.distributors.findIndex(
          (distributor) => distributor.id === action.payload.id,
        );
        if (index !== -1) {
          state.distributors[index] = action.payload;
        }
        toast.success("Distributor updated successfully");
      })
      .addCase(updateDistributor.rejected, (state, action) => {
        toast.error(action.error.message || "Failed to update distributor");
      })
      .addCase(deleteDistributor.fulfilled, (state, action) => {
        state.distributors = state.distributors.filter(
          (distributor) => distributor.id !== action.payload,
        );
        toast.success("Distributor deleted successfully");
      })
      .addCase(deleteDistributor.rejected, (state, action) => {
        toast.error(action.error.message || "Failed to delete distributor");
      });
  },
});

export default distributorSlice.reducer;
