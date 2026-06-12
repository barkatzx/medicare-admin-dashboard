"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsers, approveUser, deleteUser } from "@/store/slices/userSlice";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  CheckCircle,
  Mail,
  Phone,
  RefreshCw,
  Calendar,
  Clock,
  Search,
  Users as UsersIcon,
  UserCheck,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Shield,
} from "lucide-react";

export default function PendingUsersPage() {
  const dispatch = useAppDispatch();
  const { users, loading } = useAppSelector((state) => state.users);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchUsers({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleApprove = async (userId: string) => {
    setApprovingId(userId);
    await dispatch(approveUser(userId));
    setApprovingId(null);
    window.dispatchEvent(new Event("usersUpdated"));
  };

  const handleDeleteClick = (user: any) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeletingId(userToDelete.id);
    try {
      await dispatch(deleteUser(userToDelete.id)).unwrap();
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      window.dispatchEvent(new Event("usersUpdated"));
    } catch (error: any) {
      // Error handled by slice
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const isPending = !user.isApproved && user.role !== "admin";
    if (!isPending) return false;

    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone_number.includes(searchTerm);

    return matchesSearch;
  });

  const totalPending = users.filter(
    (u) => !u.isApproved && u.role !== "admin",
  ).length;

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading pending users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search pending users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
          />
        </div>
        <button
          onClick={() => dispatch(fetchUsers({ page: 1, limit: 20 }))}
          className="px-5 py-2.5 bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Pending Approvals Table */}
      <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <Clock size={16} className="text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Approvals
            </h2>
            <span className="px-2.5 py-0.5 bg-amber-200 text-amber-800 text-xs font-medium rounded-full ml-2">
              {filteredUsers.length}
            </span>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Clock size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No pending approvals</p>
            <p className="text-sm text-gray-400 mt-1">
              All user requests have been processed
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-50 hover:bg-amber-50/20 transition-colors"
                  >
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-white font-semibold text-sm">
                            {user.name?.charAt(0) || "U"}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {user.name || "Unnamed User"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={14} className="text-gray-400" />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} className="text-gray-400" />
                        <span>{user.phone_number}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                        <Clock size={10} />
                        Pending
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleApprove(user.id)}
                          loading={approvingId === user.id}
                          className="p-2 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-all duration-200 text-emerald-600"
                        >
                          <CheckCircle size={16} className="text-emerald-600" />
                        </Button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="p-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-lg transition-all duration-200"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Are you sure you want to delete the user{" "}
                <strong className="text-gray-900">
                  "{userToDelete?.name || userToDelete?.email}"
                </strong>
                ?
              </p>
              <p className="text-xs text-red-600 mt-1">
                This action cannot be undone. All user data will be permanently
                removed.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              loading={deletingId === userToDelete?.id}
              className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
