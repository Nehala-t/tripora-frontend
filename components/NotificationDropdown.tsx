
"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiLoader,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import type { AppDispatch, RootState } from "@/redux/store";

import {
  deleteNotification,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type TriporaNotification,
} from "@/redux/slices/notificationSlice";

interface NotificationDropdownProps {
  isLoggedIn: boolean;
}

function formatNotificationDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const difference = now.getTime() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (difference < minute) return "Just now";
  if (difference < hour) {
    return `${Math.floor(difference / minute)}m ago`;
  }
  if (difference < day) {
    return `${Math.floor(difference / hour)}h ago`;
  }
  if (difference < 7 * day) {
    return `${Math.floor(difference / day)}d ago`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getNotificationIcon(type: string) {
  switch (type?.toLowerCase()) {
    case "booking":
      return "bg-blue-50 text-blue-600";

    case "payment":
      return "bg-emerald-50 text-emerald-600";

    case "review":
      return "bg-amber-50 text-amber-600";

    case "welcome":
      return "bg-violet-50 text-violet-600";

    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function NotificationDropdown({
  isLoggedIn,
}: NotificationDropdownProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    actionLoading,
    error,
  } = useSelector((state: RootState) => state.notifications);

  // Keep the unread badge fresh while the user is logged in.
  // Polling interval: 30 seconds.
  useEffect(() => {
    if (!isLoggedIn) return;

    dispatch(fetchUnreadNotificationCount());

    const intervalId = window.setInterval(() => {
      dispatch(fetchUnreadNotificationCount());

      // Refresh the dropdown list too, but only while it is open.
      if (isOpen) {
        dispatch(fetchNotifications());
      }
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [dispatch, isLoggedIn, isOpen]);

  // Load the notification list when the dropdown opens.
  useEffect(() => {
    if (isLoggedIn && isOpen) {
      dispatch(fetchNotifications());
      dispatch(fetchUnreadNotificationCount());
    }
  }, [dispatch, isLoggedIn, isOpen]);

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // Close the dropdown with Escape.
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen((previous) => !previous);
  };

  const handleMarkAsRead = async (
    notification: TriporaNotification
  ) => {
    if (notification.readAt) return;

    try {
      await dispatch(
        markNotificationAsRead(notification._id)
      ).unwrap();

      dispatch(fetchUnreadNotificationCount());
    } catch {
      // The Redux slice stores the request error.
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllNotificationsAsRead()).unwrap();
      dispatch(fetchUnreadNotificationCount());
    } catch {
      // The Redux slice stores the request error.
    }
  };

  const handleDelete = async (
    notificationId: string
  ) => {
    try {
      await dispatch(
        deleteNotification(notificationId)
      ).unwrap();

      dispatch(fetchUnreadNotificationCount());
    } catch {
      // The Redux slice stores the request error.
    }
  };

  const handleNotificationClick = async (
    notification: TriporaNotification
  ) => {
    if (!notification.readAt) {
      try {
        await dispatch(
          markNotificationAsRead(notification._id)
        ).unwrap();
      } catch {
        // Keep the notification visible even if marking as read fails.
      }
    }

    // Do not navigate to a separate notifications page.
    // Navigate only if this particular notification has an action URL.
    if (notification.actionUrl) {
      const actionUrl = notification.actionUrl.trim();

      // Only allow internal relative paths or same-origin URLs.
      if (actionUrl.startsWith("/") && !actionUrl.startsWith("//")) {
        setIsOpen(false);
        router.push(actionUrl);
      } else {
        try {
          const parsedUrl = new URL(actionUrl);

          if (parsedUrl.origin === window.location.origin) {
            setIsOpen(false);
            router.push(
              parsedUrl.pathname +
                parsedUrl.search +
                parsedUrl.hash
            );
          }
        } catch {
          // Ignore invalid or external action URLs.
        }
      }
    }

    dispatch(fetchUnreadNotificationCount());
  };

  if (!isLoggedIn) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification bell */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Open notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="relative flex h-10 w-10 items-center justify-center rounded-full
          border border-gray-200 bg-white text-gray-700
          transition-all duration-200 hover:border-blue-200
          hover:bg-blue-50 hover:text-blue-600
          focus:outline-none focus:ring-2 focus:ring-blue-500
          focus:ring-offset-2"
      >
        <FiBell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex min-h-[19px]
              min-w-[19px] items-center justify-center rounded-full
              border-2 border-white bg-red-500 px-1 text-[10px]
              font-bold leading-none text-white shadow-sm"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-[100] mt-3
            w-[min(92vw,400px)] overflow-hidden rounded-2xl
            border border-gray-200 bg-white shadow-2xl
            shadow-gray-900/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">
                  Notifications
                </h2>

                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-gray-500">
                Updates about your Tripora activities
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-4 py-2.5">
              <span className="text-xs font-medium text-gray-500">
                {notifications.length}{" "}
                {notifications.length === 1
                  ? "notification"
                  : "notifications"}
              </span>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={actionLoading === "mark-all"}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold
                    text-blue-600 transition hover:text-blue-800
                    disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "mark-all" ? (
                    <FiLoader className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FiCheckCircle className="h-3.5 w-3.5" />
                  )}
                  Mark all as read
                </button>
              )}
            </div>
          )}

          {/* Notification list */}
          <div className="max-h-[min(65vh,440px)] overflow-y-auto overscroll-contain">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12">
                <FiLoader className="h-7 w-7 animate-spin text-blue-600" />
                <p className="mt-3 text-sm text-gray-500">
                  Loading notifications...
                </p>
              </div>
            ) : error && notifications.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm font-medium text-red-600">
                  Could not load notifications
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => dispatch(fetchNotifications())}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <FiBell className="h-6 w-6" />
                </div>

                <h3 className="mt-4 text-sm font-bold text-gray-900">
                  You&apos;re all caught up!
                </h3>

                <p className="mt-1 max-w-[240px] text-xs leading-5 text-gray-500">
                  New booking updates and travel alerts will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const isUnread = !notification.readAt;
                  const isDeleting =
                    actionLoading === notification._id;

                  return (
                    <div
                      key={notification._id}
                      className={`group relative flex gap-3 px-4 py-4 transition
                        hover:bg-gray-50 ${
                          isUnread ? "bg-blue-50/40" : "bg-white"
                        }`}
                    >
                      {/* Type icon */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
                          ${getNotificationIcon(notification.type)}`}
                      >
                        {notification.type?.toLowerCase() ===
                        "welcome" ? (
                          <FiCheckCircle className="h-5 w-5" />
                        ) : notification.type?.toLowerCase() ===
                          "booking" ? (
                          <FiClock className="h-5 w-5" />
                        ) : (
                          <FiBell className="h-5 w-5" />
                        )}
                      </div>

                      {/* Notification content */}
                      <button
                        type="button"
                        onClick={() =>
                          handleNotificationClick(notification)
                        }
                        className="min-w-0 flex-1 text-left focus:outline-none"
                      >
                        <div className="flex items-start gap-2">
                          <span className="line-clamp-1 text-sm font-semibold text-gray-900">
                            {notification.title}
                          </span>

                          {isUnread && (
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600"
                              aria-label="Unread"
                            />
                          )}
                        </div>

                        <p className="mt-1 line-clamp-3 text-xs leading-5 text-gray-600">
                          {notification.message}
                        </p>

                        <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-400">
                          <FiClock className="h-3 w-3" />
                          <span>
                            {formatNotificationDate(
                              notification.createdAt
                            )}
                          </span>

                          {notification.actionUrl && (
                            <>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                                View details
                                <FiExternalLink className="h-3 w-3" />
                              </span>
                            </>
                          )}
                        </div>
                      </button>

                      {/* Per-notification actions */}
                      <div className="flex shrink-0 flex-col items-center gap-1">
                        {isUnread && (
                          <button
                            type="button"
                            onClick={() =>
                              handleMarkAsRead(notification)
                            }
                            aria-label="Mark as read"
                            title="Mark as read"
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                          >
                            <FiCheck className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(notification._id)
                          }
                          disabled={isDeleting}
                          aria-label="Delete notification"
                          title="Delete notification"
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <FiLoader className="h-4 w-4 animate-spin" />
                          ) : (
                            <FiTrash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/70 px-4 py-3">
              <span className="text-[11px] text-gray-400">
                Updates refresh automatically
              </span>

              <button
                type="button"
                onClick={() => {
                  dispatch(fetchNotifications());
                  dispatch(fetchUnreadNotificationCount());
                }}
                className="text-xs font-semibold text-blue-600 transition hover:text-blue-800"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
