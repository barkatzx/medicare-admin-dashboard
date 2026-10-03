"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchNotifications,
  fetchUsersForNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendNotification,
  sendBulkNotifications,
  clearNotificationState,
} from "@/store/slices/notificationSlice";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  Bell,
  CheckCircle,
  Clock,
  RefreshCw,
  Package,
  CreditCard,
  AlertCircle,
  CheckCheck,
  Send,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const { notifications, users, unreadCount, loading } = useAppSelector(
    (state) => state.notifications,
  );
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [sendForm, setSendForm] = useState({
    userId: "",
    title: "",
    message: "",
    type: "system",
  });
  const [bulkForm, setBulkForm] = useState({
    title: "",
    message: "",
    type: "system",
  });

  useEffect(() => {
    dispatch(fetchNotifications());
    dispatch(fetchUsersForNotification());
    return () => {
      dispatch(clearNotificationState());
    };
  }, [dispatch]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await dispatch(markNotificationAsRead(notificationId)).unwrap();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllNotificationsAsRead()).unwrap();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleSendNotification = async () => {
    if (!sendForm.userId) {
      toast.error("Please select a user");
      return;
    }
    if (!sendForm.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!sendForm.message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);
    try {
      await dispatch(sendNotification(sendForm)).unwrap();
      toast.success("Notification sent successfully");
      setIsSendModalOpen(false);
      setSendForm({ userId: "", title: "", message: "", type: "system" });
      dispatch(fetchNotifications());
    } catch (error: any) {
      toast.error(error?.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  const handleSendBulkNotifications = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one user");
      return;
    }
    if (!bulkForm.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!bulkForm.message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);
    try {
      await dispatch(
        sendBulkNotifications({
          userIds: selectedUserIds,
          title: bulkForm.title,
          message: bulkForm.message,
          type: bulkForm.type,
        }),
      ).unwrap();
      toast.success(`Notification sent to ${selectedUserIds.length} user(s)`);
      setIsBulkModalOpen(false);
      setSelectedUserIds([]);
      setBulkForm({ title: "", message: "", type: "system" });
      dispatch(fetchNotifications());
    } catch (error: any) {
      toast.error(error?.message || "Failed to send notifications");
    } finally {
      setSending(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map((user) => user.id));
    }
  };

  const handleSelectRole = (role: string) => {
    const roleUserIds = users
      .filter((user) => user.role === role)
      .map((user) => user.id);
    setSelectedUserIds(roleUserIds);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return <Package size={18} className="text-blue-600" />;
      case "approval":
        return <CreditCard size={18} className="text-green-600" />;
      case "system":
        return <AlertCircle size={18} className="text-yellow-600" />;
      default:
        return <Bell size={18} className="text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "order":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "approval":
        return "bg-green-100 text-green-700 border-green-200";
      case "system":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000,
    );
    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
    ];
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
      }
    }
    return "just now";
  };

  const filteredNotifications = notifications
    .filter((notif) => {
      if (filter === "unread") return !notif.isRead;
      if (filter === "read") return notif.isRead;
      return true;
    })
    .filter((notif) => {
      if (selectedType === "all") return true;
      return notif.type === selectedType;
    });

  const stats = [
    { label: "Total", value: notifications.length, icon: Bell, color: "blue" },
    { label: "Unread", value: unreadCount, icon: Clock, color: "red" },
    {
      label: "Read",
      value: notifications.length - unreadCount,
      icon: CheckCircle,
      color: "green",
    },
  ];

  const adminCount = users.filter((u) => u.role === "admin").length;
  const customerCount = users.filter((u) => u.role === "customer").length;

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-48 w-48 rounded-full bg-white/5"></div>
        <div className="relative">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="mt-2 text-blue-100">
                Stay updated with your latest activities
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => setIsSendModalOpen(true)}
                className="bg-white/20 text-white hover:bg-white/30 border-white/30"
              >
                <Send size={16} className="mr-2" />
                Send to User
              </Button>
              <Button
                onClick={() => setIsBulkModalOpen(true)}
                className="bg-white/20 text-white hover:bg-white/30 border-white/30"
              >
                <Users size={16} className="mr-2" />
                Bulk Send
              </Button>
              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  variant="secondary"
                  className="bg-white/20 text-white hover:bg-white/30 border-white/30"
                >
                  <CheckCheck size={16} className="mr-2" />
                  Mark all as read
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: "bg-blue-100 text-blue-600",
            red: "bg-red-100 text-red-600",
            green: "bg-green-100 text-green-600",
          };
          return (
            <div
              key={stat.label}
              className="rounded-xl bg-white p-4 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 ${colorClasses[stat.color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center`}
                >
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          {(["all", "unread", "read"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? f === "all"
                    ? "bg-blue-600 text-white"
                    : f === "unread"
                      ? "bg-red-600 text-white"
                      : "bg-green-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Types</option>
            <option value="order">Orders</option>
            <option value="approval">Approval</option>
            <option value="system">System</option>
          </select>
          <button
            onClick={() => dispatch(fetchNotifications())}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Bell size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Notifications
                {filter !== "all" && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({filter === "unread" ? "Unread" : "Read"} only)
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-500">
                {filteredNotifications.length} notification
                {filteredNotifications.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </div>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium">
              No notifications
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {filter !== "all"
                ? `No ${filter} notifications found`
                : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 transition-all hover:bg-gray-50 ${
                  !notification.isRead ? "bg-blue-50/30" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(notification.type)}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Clock size={12} />
                            {getTimeAgo(notification.createdAt)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}
                          >
                            {notification.type === "order" && (
                              <Package size={10} />
                            )}
                            {notification.type === "approval" && (
                              <CreditCard size={10} />
                            )}
                            {notification.type === "system" && (
                              <AlertCircle size={10} />
                            )}
                            {notification.type.charAt(0).toUpperCase() +
                              notification.type.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.isRead ? (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Mark as read
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-green-600">
                            <CheckCircle size={12} />
                            Read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send to Single User Modal */}
      <Modal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        title="Send Notification"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User *
            </label>
            <select
              value={sendForm.userId}
              onChange={(e) =>
                setSendForm({ ...sendForm, userId: e.target.value })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Select a user</option>
              <optgroup label="Admins">
                {users
                  .filter((u) => u.role === "admin")
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}) - Admin
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Customers">
                {users
                  .filter((u) => u.role === "customer")
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="TSRs">
                {users
                  .filter((u) => u.role === "TSR")
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Type
            </label>
            <select
              value={sendForm.type}
              onChange={(e) =>
                setSendForm({ ...sendForm, type: e.target.value })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="system">System</option>
              <option value="order">Order</option>
              <option value="approval">Approval</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={sendForm.title}
              onChange={(e) =>
                setSendForm({ ...sendForm, title: e.target.value })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Notification title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={sendForm.message}
              onChange={(e) =>
                setSendForm({ ...sendForm, message: e.target.value })
              }
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Notification message"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSendNotification}
              loading={sending}
              className="flex-1"
            >
              <Send size={16} className="mr-2" />
              Send Notification
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsSendModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Send Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => {
          setIsBulkModalOpen(false);
          setSelectedUserIds([]);
        }}
        title="Bulk Send Notifications"
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Users *
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {selectedUserIds.length === users.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <span className="text-xs text-gray-300">|</span>
                <button
                  onClick={() => handleSelectRole("admin")}
                  className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Admins ({adminCount})
                </button>
                <span className="text-xs text-gray-300">|</span>
                <button
                  onClick={() => handleSelectRole("customer")}
                  className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Customers ({customerCount})
                </button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2">
              {users.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No users found</p>
              ) : (
                users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                        {user.role === "admin" && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
            {selectedUserIds.length > 0 && (
              <p className="text-xs text-blue-600 mt-2">
                {selectedUserIds.length} user(s) selected
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Type
            </label>
            <select
              value={bulkForm.type}
              onChange={(e) =>
                setBulkForm({ ...bulkForm, type: e.target.value })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="system">System</option>
              <option value="order">Order</option>
              <option value="approval">Approval</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={bulkForm.title}
              onChange={(e) =>
                setBulkForm({ ...bulkForm, title: e.target.value })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Notification title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={bulkForm.message}
              onChange={(e) =>
                setBulkForm({ ...bulkForm, message: e.target.value })
              }
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Notification message"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSendBulkNotifications}
              loading={sending}
              disabled={selectedUserIds.length === 0}
              className="flex-1"
            >
              <Users size={16} className="mr-2" />
              Send to {selectedUserIds.length} User(s)
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsBulkModalOpen(false);
                setSelectedUserIds([]);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
