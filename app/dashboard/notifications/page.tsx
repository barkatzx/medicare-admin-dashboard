"use client";

import {
  getUsers,
  sendNotificationToAll,
  sendNotificationToUser,
  type NotificationType,
  type User,
} from "@/config/api";
import {
  Bell,
  ImagePlus,
  Loader2,
  Search,
  Send,
  Users,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useDebouncedValue } from "@/components/utils/useDebouncedValue";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

export default function NotificationsPage() {
  const [recipient, setRecipient] = useState<"single" | "all">("single");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<User[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(true);
  const [userSearchError, setUserSearchError] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userPages, setUserPages] = useState(1);
  const debouncedUserSearch = useDebouncedValue(userSearch.trim());
  const [type, setType] = useState<NotificationType>("system");
  const [photo, setPhoto] = useState<File | undefined>();
  const [photoError, setPhotoError] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (recipient !== "single") return;
    const controller = new AbortController();
    getUsers(userPage, 10, debouncedUserSearch || undefined, controller.signal)
      .then(({ users, pagination }) => {
        setUserResults(users.filter((user) => user.role !== "admin"));
        setUserPages(pagination.pages);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setUserSearchError(
            error instanceof Error ? error.message : "Unable to load users.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setUserSearchLoading(false);
      });
    return () => controller.abort();
  }, [recipient, userPage, debouncedUserSearch]);

  const handlePhotoChange = (file?: File) => {
    setPhotoError("");
    setPhoto(undefined);
    if (!file) return;
    if (!acceptedTypes.includes(file.type)) {
      setPhotoError("Choose a JPG, PNG, or WebP image.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setPhoto(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = String(form.get("title") || "").trim();
    const message = String(form.get("message") || "").trim();
    if (
      !title ||
      !message ||
      (recipient === "single" && !selectedUser) ||
      photoError
    ) {
      setFeedback({
        kind: "error",
        text: "Complete the required fields and fix the photo selection.",
      });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const payload = { title, message, type, ...(photo ? { photo } : {}) };
      if (recipient === "single" && selectedUser)
        await sendNotificationToUser(selectedUser.id, payload);
      else await sendNotificationToAll(payload);
      setFeedback({
        kind: "success",
        text:
          recipient === "single"
            ? "Notification sent successfully."
            : "Notification sent to all eligible users.",
      });
      formElement.reset();
      if (fileInput.current) fileInput.current.value = "";
      setSelectedUser(null);
      setUserSearch("");
      setUserPage(1);
      setType("system");
      setPhoto(undefined);
    } catch (error) {
      setFeedback({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to send the notification. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 md:space-y-7">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-gray-100 bg-white p-5 md:space-y-7 md:p-7"
      >
        <section>
          <h2 className="text-sm font-semibold text-gray-900 md:text-[13px] md:font-semibold md:uppercase md:tracking-wider md:text-gray-500">
            Recipient
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 md:mt-4">
            <button
              type="button"
              onClick={() => {
                setRecipient("single");
                setUserSearchLoading(true);
                setUserSearchError("");
              }}
              aria-pressed={recipient === "single"}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                recipient === "single"
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 md:border-blue-300 md:bg-blue-50/70 md:ring-blue-500/20"
                  : "border-gray-200 hover:border-gray-300 md:border-gray-100 md:hover:border-gray-200 md:hover:bg-gray-50/60"
              }`}
            >
              <UserRound
                className={
                  recipient === "single"
                    ? "text-blue-600 md:size-[18px]"
                    : "text-gray-500 md:size-[18px]"
                }
                size={20}
              />
              <span>
                <span className="block text-sm font-semibold text-gray-900 md:text-[13px]">
                  Single User
                </span>
                <span className="mt-0.5 block text-xs text-gray-500 md:text-[12px]">
                  Search and select a user
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRecipient("all")}
              aria-pressed={recipient === "all"}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                recipient === "all"
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 md:border-blue-300 md:bg-blue-50/70 md:ring-blue-500/20"
                  : "border-gray-200 hover:border-gray-300 md:border-gray-100 md:hover:border-gray-200 md:hover:bg-gray-50/60"
              }`}
            >
              <Users
                className={
                  recipient === "all"
                    ? "text-blue-600 md:size-[18px]"
                    : "text-gray-500 md:size-[18px]"
                }
                size={20}
              />
              <span>
                <span className="block text-sm font-semibold text-gray-900 md:text-[13px]">
                  All Users
                </span>
                <span className="mt-0.5 block text-xs text-gray-500 md:text-[12px]">
                  Send to eligible users
                </span>
              </span>
            </button>
          </div>

          {recipient === "single" && (
            <div className="mt-4">
              <label
                htmlFor="user-search"
                className="block text-sm font-medium text-gray-700 md:text-[13px] md:font-semibold md:text-gray-600"
              >
                Select user
              </label>
              {selectedUser ? (
                <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 md:rounded-xl md:border-blue-200/70 md:bg-blue-50/70">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 md:text-[13px]">
                      {selectedUser.name ||
                        selectedUser.pharmacy_name ||
                        selectedUser.email}
                    </p>
                    <p className="truncate text-xs text-gray-600 md:text-[12px]">
                      {selectedUser.email} · {selectedUser.phone_number}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="shrink-0 text-sm font-medium text-blue-700 hover:text-blue-900 md:text-[12px] md:font-semibold"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mt-1.5">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 md:size-[15px]"
                    />
                    <input
                      id="user-search"
                      value={userSearch}
                      onChange={(event) => {
                        setUserSearch(event.target.value);
                        setUserPage(1);
                        setUserSearchLoading(true);
                        setUserSearchError("");
                      }}
                      placeholder="Search by name, email, or phone"
                      className="block w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:rounded-xl md:border-gray-100 md:bg-gray-50/60 md:py-2.5 md:pl-9 md:pr-3.5 md:text-[13px] md:focus:bg-white md:focus:border-blue-400 md:focus:ring-4 md:focus:ring-blue-500/10"
                    />
                  </div>
                  <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200 md:rounded-xl md:border-gray-100">
                    {userSearchLoading ? (
                      <p className="px-4 py-6 text-center text-sm text-gray-500">
                        Loading users…
                      </p>
                    ) : userSearchError ? (
                      <p
                        role="alert"
                        className="px-4 py-4 text-sm text-rose-600"
                      >
                        {userSearchError}
                      </p>
                    ) : userResults.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-gray-500">
                        No users found.
                      </p>
                    ) : (
                      userResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-blue-50 md:px-4 md:py-3 md:transition-colors md:hover:bg-blue-50/60"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-gray-900 md:text-[13px]">
                              {user.name || user.pharmacy_name || user.email}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-gray-500 md:text-[12px]">
                              {user.email} · {user.phone_number}
                            </span>
                          </span>
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium capitalize text-gray-600 ring-1 ring-inset ring-gray-100 md:text-[10px]">
                            {user.role}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                  {userPages > 1 && (
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500 md:mt-3 md:text-[12px]">
                      <span>
                        Page {userPage} of {userPages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={userPage <= 1 || userSearchLoading}
                          onClick={() => {
                            setUserPage((page) => page - 1);
                            setUserSearchLoading(true);
                          }}
                          className="rounded border border-gray-200 px-2.5 py-1.5 disabled:opacity-40 md:rounded-lg md:border-gray-100 md:bg-white md:px-2.5 md:py-1 md:text-[12px] md:font-medium md:transition-colors md:hover:bg-gray-50 md:hover:text-gray-900 md:disabled:hover:bg-white"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={userPage >= userPages || userSearchLoading}
                          onClick={() => {
                            setUserPage((page) => page + 1);
                            setUserSearchLoading(true);
                          }}
                          className="rounded border border-gray-200 px-2.5 py-1.5 disabled:opacity-40 md:rounded-lg md:border-gray-100 md:bg-white md:px-2.5 md:py-1 md:text-[12px] md:font-medium md:transition-colors md:hover:bg-gray-50 md:hover:text-gray-900 md:disabled:hover:bg-white"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        <div className="grid gap-5 sm:grid-cols-2 md:gap-6">
          <label className="text-sm font-medium text-gray-700 md:text-[13px] md:font-semibold md:text-gray-600">
            Notification type
            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value as NotificationType)
              }
              className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:rounded-xl md:border-gray-100 md:bg-gray-50/60 md:px-3.5 md:text-[13px] md:focus:bg-white md:focus:border-blue-400 md:focus:ring-4 md:focus:ring-blue-500/10"
            >
              <option value="system">System</option>
              <option value="order">Order</option>
              <option value="approval">Approval</option>
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700 md:text-[13px] md:font-semibold md:text-gray-600">
            Title
            <input
              name="title"
              required
              maxLength={150}
              placeholder="Notification title"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:rounded-xl md:border-gray-100 md:bg-gray-50/60 md:px-3.5 md:text-[13px] md:focus:bg-white md:focus:border-blue-400 md:focus:ring-4 md:focus:ring-blue-500/10"
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-gray-700 md:text-[13px] md:font-semibold md:text-gray-600">
          Message
          <textarea
            name="message"
            required
            rows={5}
            maxLength={2000}
            placeholder="Write your notification message…"
            className="mt-1.5 block w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:rounded-xl md:border-gray-100 md:bg-gray-50/60 md:px-3.5 md:py-2.5 md:text-[13px] md:leading-6 md:focus:bg-white md:focus:border-blue-400 md:focus:ring-4 md:focus:ring-blue-500/10"
          />
        </label>

        <div>
          <span className="block text-sm font-medium text-gray-700 md:text-[13px] md:font-semibold md:text-gray-600">
            Photo{" "}
            <span className="font-normal text-gray-400 md:text-[12px]">
              (optional)
            </span>
          </span>
          <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 p-4 transition hover:border-blue-400 hover:bg-blue-50/50 md:border-gray-200 md:p-4 md:hover:border-blue-300 md:hover:bg-blue-50/40">
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600 md:size-[38px] md:flex md:items-center md:justify-center md:rounded-lg">
              <ImagePlus size={20} className="md:size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-gray-800 md:text-[13px]">
                {photo?.name || "Choose an image"}
              </span>
              <span className="mt-0.5 block text-xs text-gray-500 md:text-[12px]">
                JPG, PNG, or WebP
              </span>
            </span>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => handlePhotoChange(event.target.files?.[0])}
            />
          </label>
          {photoError && (
            <p role="alert" className="mt-2 text-sm text-rose-600">
              {photoError}
            </p>
          )}
        </div>

        {feedback && (
          <p
            role="status"
            className={`rounded-lg px-4 py-3 text-sm md:rounded-xl md:text-[13px] md:font-medium ${feedback.kind === "success" ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15" : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/15"}`}
          >
            {feedback.text}
          </p>
        )}
        <div className="flex justify-end border-t border-gray-100 pt-5 md:pt-6">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 md:rounded-xl md:px-5 md:py-2.5 md:text-[13px] md:font-semibold"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin md:size-[15px]" />
                Sending…
              </>
            ) : (
              <>
                <Send size={16} className="md:size-[15px]" />
                Send notification
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
