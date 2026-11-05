'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { FiStar } from 'react-icons/fi';
import {
    FiCompass,
    FiMenu,
    FiX,
    FiArrowUpRight,
    FiUser,
    FiLogOut,
    FiCalendar,
    FiGrid,
    FiHelpCircle,
    FiChevronDown,
    FiShield,
    FiHeart,
    FiCheckCircle,
    FiMail,
    FiBookOpen,
} from 'react-icons/fi';

import type { RootState, AppDispatch } from '@/redux/store';

import { fetchCurrentUser, logoutUser } from '@/redux/slices/authSlice';

import {
    fetchUnreadNotificationCount,
    resetNotifications,
} from '@/redux/slices/notificationSlice';

import NotificationDropdown from '@/components/NotificationDropdown';

interface UserProfile {
    name: string;
    email: string;
    role: 'TRAVELER' | 'OPERATOR' | 'ADMIN';
    avatarUrl?: string;
    emailVerified: boolean;
}

const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Destinations', href: '/destinations' },
    { label: 'About', href: '/about' },
    { label: 'Help & Support', href: '/help' },
];

function ProfileAvatar({
    avatarUrl,
    name,
    size = 'h-9 w-9',
}: {
    avatarUrl?: string;
    name: string;
    size?: string;
}) {
    const avatarFallback = name.trim().charAt(0).toUpperCase() || 'U';

    return (
        <div
            className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white shadow-sm ring-2 ring-white`}
        >
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={name}
                    className="h-full w-full object-cover"
                />
            ) : (
                avatarFallback
            )}
        </div>
    );
}

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    const reduxUser = useSelector((state: RootState) => state.auth.user);

    const initialized = useSelector(
        (state: RootState) => state.auth.initialized
    );

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const profileDropdownRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    const closeMenus = useCallback(() => {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
    }, []);

    // Restore login session
    useEffect(() => {
        if (!initialized) {
            dispatch(fetchCurrentUser());
        }
    }, [dispatch, initialized]);

    // Fetch unread notification count
    useEffect(() => {
        if (!initialized || !reduxUser) return;

        const fetchCount = () => {
            dispatch(fetchUnreadNotificationCount());
        };

        fetchCount();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchCount();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange
            );
        };
    }, [dispatch, initialized, reduxUser]);

    // Close menus on path change
    useEffect(() => {
        closeMenus();
    }, [pathname, closeMenus]);

    // Click outside listener for dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (
                profileDropdownRef.current &&
                !profileDropdownRef.current.contains(target)
            ) {
                setIsProfileOpen(false);
            }

            if (
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(target)
            ) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Lock scroll on mobile menu toggle
    useEffect(() => {
        if (!isMenuOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isMenuOpen]);

    const currentUser: UserProfile | null = reduxUser
        ? {
              name:
                  reduxUser.fullName ||
                  reduxUser.name ||
                  [reduxUser.firstName, reduxUser.lastName]
                      .filter(Boolean)
                      .join(' ') ||
                  reduxUser.email ||
                  'My Account',

              email: reduxUser.email || '',

              role:
                  reduxUser.role === 'operator'
                      ? 'OPERATOR'
                      : reduxUser.role === 'admin'
                        ? 'ADMIN'
                        : 'TRAVELER',

              avatarUrl: reduxUser.profileImage?.url || undefined,

              emailVerified: Boolean(
    reduxUser.emailVerified ?? reduxUser.isEmailVerified
),
          }
        : null;

    const isLoggedIn = Boolean(currentUser);
    const showAuthActions = initialized;
    const isHomeRoute = pathname === '/';

    // Each role has one permitted dashboard destination.
    const roleDashboardHref =
        reduxUser?.role === 'admin'
            ? '/adminDashboard'
            : reduxUser?.role === 'operator'
              ? '/operator/dashboard'
              : reduxUser?.role === 'user'
                ? '/toures&activities'
                : '/';

    // Account action icon destination
    const accountActionHref =
        reduxUser?.role === 'admin'
            ? '/adminDashboard'
            : reduxUser?.role === 'operator'
              ? '/operator/dashboard'
              : reduxUser?.role === 'user'
                ? '/my-bookings'
                : '/';

    // Tours & Activities is available only to authenticated users.
    const canAccessTours =
        initialized && isLoggedIn && reduxUser?.role === 'user';

    // Show the Tours & Activities navigation link only to role "user".
    const visibleNavLinks = [
        ...navLinks.slice(0, 2),
        ...(canAccessTours
            ? [{ label: 'Tours & Activities', href: '/toures&activities' }]
            : []),
        ...navLinks.slice(2),
    ];

    // Match the protected route and any nested routes.
    const isAdminRoute =
        pathname === '/adminDashboard' ||
        pathname.startsWith('/adminDashboard/');

    const isOperatorRoute =
        pathname === '/operator/dashboard' ||
        pathname.startsWith('/operator/dashboard/');

    const isUserToursRoute =
        pathname === '/toures&activities' ||
        pathname.startsWith('/toures&activities/');

    // Redirect guests to login and authenticated users to their own dashboard.
    useEffect(() => {
        if (!initialized) return;

        const isProtectedRoute =
            isAdminRoute || isOperatorRoute || isUserToursRoute;

        if (!isProtectedRoute) return;

        // No authenticated user: login is required.
        if (!reduxUser) {
            router.replace('/login');
            return;
        }

        const role = reduxUser.role;

        // Admin dashboard: admin only.
        if (isAdminRoute && role !== 'admin') {
            router.replace(roleDashboardHref);
            return;
        }

        // Operator dashboard: operator only.
        if (isOperatorRoute && role !== 'operator') {
            router.replace(roleDashboardHref);
            return;
        }

        // Tours & Activities: user only.
        if (isUserToursRoute && role !== 'user') {
            router.replace(roleDashboardHref);
        }
    }, [
        initialized,
        reduxUser,
        roleDashboardHref,
        router,
        isAdminRoute,
        isOperatorRoute,
        isUserToursRoute,
    ]);

    const dashboardHref = roleDashboardHref;

    const dashboardLabel =
        reduxUser?.role === 'admin'
            ? 'Admin Dashboard'
            : reduxUser?.role === 'operator'
              ? 'Operator Dashboard'
              : 'Tours & Activities';

    const isActiveLink = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);

        try {
            await dispatch(logoutUser()).unwrap();
            dispatch(resetNotifications());

            closeMenus();
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const roleBadgeClass =
        currentUser?.role === 'ADMIN'
            ? 'bg-purple-50 text-purple-700 ring-purple-100'
            : currentUser?.role === 'OPERATOR'
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
              : 'bg-blue-50 text-blue-700 ring-blue-100';

    const actionIcon =
        currentUser?.role === 'ADMIN' ? (
            <FiShield size={17} />
        ) : currentUser?.role === 'OPERATOR' ? (
            <FiGrid size={17} />
        ) : (
            <FiBookOpen size={17} />
        );

    return (
        <>
            <header className="absolute left-1/2 top-4 z-50 w-[96%] max-w-7xl -translate-x-1/2 sm:top-6">
                <nav
                    className={`flex min-h-[68px] items-center justify-between gap-3 rounded-full border px-3 py-2 shadow-lg backdrop-blur-xl transition-all duration-300 sm:px-5 ${
                        isHomeRoute
                            ? 'border-white/20 bg-white/[0.08] shadow-black/10'
                            : 'border-blue-100/80 bg-white/85 shadow-slate-900/[0.06]'
                    }`}
                >
                    {/* Brand */}
                    <Link
                        href="/"
                        onClick={closeMenus}
                        aria-label="Tripora homepage"
                        className="group flex shrink-0 items-center gap-2"
                    >
                        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-600/25 transition duration-300 group-hover:rotate-[-8deg] group-hover:scale-105 sm:h-11 sm:w-11">
                            <FiCompass size={23} />
                            <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-amber-400" />
                        </span>

                        <span
                            className={`text-xl font-extrabold tracking-tight sm:text-2xl ${
                                isHomeRoute ? 'text-white' : 'text-slate-900'
                            }`}
                        >
                            tripora<span className="text-blue-400">.</span>
                        </span>
                    </Link>

                    {/* Desktop pill navigation */}
                    <div
                        className={`hidden items-center gap-1 rounded-full border p-1.5 backdrop-blur-md lg:flex ${
                            isHomeRoute
                                ? 'border-blue-200/20 bg-blue-400/15'
                                : 'border-blue-100 bg-blue-50/70'
                        }`}
                    >
                        {visibleNavLinks.map((link) => {
                            const active = isActiveLink(link.href);

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={closeMenus}
                                    className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-all duration-200 xl:px-4 xl:text-sm ${
                                        active
                                            ? 'bg-white text-blue-700 shadow-md shadow-blue-950/5'
                                            : isHomeRoute
                                              ? 'text-white/90 hover:bg-white/20 hover:text-white'
                                              : 'text-slate-600 hover:bg-white hover:text-blue-700'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Desktop account actions */}
                    <div className="hidden shrink-0 items-center gap-2 xl:gap-3 lg:flex">
                        {!showAuthActions ? (
                            <div
                                className={`h-10 w-24 animate-pulse rounded-full ${
                                    isHomeRoute ? 'bg-white/20' : 'bg-slate-200'
                                }`}
                                aria-label="Checking login status"
                            />
                        ) : isLoggedIn && currentUser ? (
                            <>
                                <Link
                                    href={accountActionHref}
                                    onClick={closeMenus}
                                    title={
                                        reduxUser?.role === 'user'
                                            ? 'My Bookings'
                                            : dashboardLabel
                                    }
                                    className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                                        isHomeRoute
                                            ? 'border-white/20 bg-white/10 text-white hover:bg-white/25'
                                            : 'border-blue-100 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                                    }`}
                                >
                                    {actionIcon}
                                </Link>

                                <NotificationDropdown isLoggedIn={isLoggedIn} />

                                {/* Profile dropdown */}
                                <div
                                    className="relative"
                                    ref={profileDropdownRef}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsProfileOpen(
                                                (previous) => !previous
                                            )
                                        }
                                        aria-expanded={isProfileOpen}
                                        aria-label="Open profile menu"
                                        className={`flex max-w-[190px] items-center gap-2 rounded-full border p-1 pr-3 transition-all duration-200 ${
                                            isProfileOpen
                                                ? 'border-blue-300 bg-white shadow-md'
                                                : isHomeRoute
                                                  ? 'border-white/25 bg-white/10 hover:bg-white/20'
                                                  : 'border-blue-100 bg-white hover:border-blue-300 hover:shadow-sm'
                                        }`}
                                    >
                                        <ProfileAvatar
                                            avatarUrl={currentUser.avatarUrl}
                                            name={currentUser.name}
                                        />

                                        <span
                                            className={`max-w-24 truncate text-sm font-semibold ${
                                                isHomeRoute
                                                    ? 'text-white'
                                                    : 'text-slate-800'
                                            }`}
                                        >
                                            {currentUser.name}
                                        </span>

                                        <FiChevronDown
                                            size={14}
                                            className={`transition-transform duration-200 ${
                                                isHomeRoute
                                                    ? 'text-white/80'
                                                    : 'text-slate-400'
                                            } ${isProfileOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {isProfileOpen && (
                                        <div className="absolute right-0 top-full mt-3 w-72 origin-top-right overflow-hidden rounded-3xl border border-blue-100/80 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.18)]">
                                            <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-5 py-5">
                                                <div className="flex items-center gap-3">
                                                    <ProfileAvatar
                                                        avatarUrl={
                                                            currentUser.avatarUrl
                                                        }
                                                        name={currentUser.name}
                                                        size="h-12 w-12"
                                                    />

                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-bold text-slate-900">
                                                            {currentUser.name}
                                                        </p>
                                                        <p className="mt-1 truncate text-xs text-slate-500">
                                                            {currentUser.email}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wider ring-1 ${roleBadgeClass}`}
                                                >
                                                    {currentUser.role ===
                                                    'ADMIN' ? (
                                                        <FiShield size={11} />
                                                    ) : currentUser.role ===
                                                      'OPERATOR' ? (
                                                        <FiCompass size={11} />
                                                    ) : (
                                                        <FiUser size={11} />
                                                    )}
                                                    {currentUser.role}
                                                </span>
                                            </div>

                                            <div className="space-y-1 p-2">
                                                <Link
                                                    href="/profile"
                                                    onClick={closeMenus}
                                                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                                                >
                                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                                                        <FiUser size={17} />
                                                    </span>
                                                    <span className="flex-1">
                                                        My Profile
                                                    </span>
                                                    <FiArrowUpRight size={15} />
                                                </Link>

                                                {/* Email verification */}
                                                <Link
                                                    href="/verify-email"
                                                    onClick={closeMenus}
                                                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                                                >
                                                    <span
                                                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                                            currentUser.emailVerified
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : 'bg-amber-50 text-amber-600'
                                                        }`}
                                                    >
                                                        {currentUser.emailVerified ? (
                                                            <FiCheckCircle
                                                                size={17}
                                                            />
                                                        ) : (
                                                            <FiMail size={17} />
                                                        )}
                                                    </span>

                                                    <span className="min-w-0 flex-1">
                                                        <span className="block">
                                                            Email Verification
                                                        </span>
                                                        <span
                                                            className={`mt-0.5 block text-xs font-semibold ${
                                                                currentUser.emailVerified
                                                                    ? 'text-emerald-600'
                                                                    : 'text-amber-600'
                                                            }`}
                                                        >
                                                            {currentUser.emailVerified
                                                                ? 'Email verified'
                                                                : 'Verification required'}
                                                        </span>
                                                    </span>

                                                    {!currentUser.emailVerified && (
                                                        <FiArrowUpRight
                                                            size={15}
                                                        />
                                                    )}
                                                </Link>

                                                {/* User-only menu items */}
                                                {reduxUser?.role === 'user' && (
                                                    <>
                                                        <Link
                                                            href="/my-bookings"
                                                            onClick={closeMenus}
                                                            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                                                        >
                                                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                                                                <FiCalendar
                                                                    size={17}
                                                                />
                                                            </span>
                                                            <span className="flex-1">
                                                                My Bookings
                                                            </span>
                                                            <FiArrowUpRight
                                                                size={15}
                                                            />
                                                        </Link>

                                                        <Link
                                                            href="/wishlist"
                                                            onClick={closeMenus}
                                                            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-rose-50 hover:text-rose-600"
                                                        >
                                                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                                                                <FiHeart
                                                                    size={17}
                                                                />
                                                            </span>
                                                            <span className="flex-1">
                                                                My Wishlist
                                                            </span>
                                                            <FiArrowUpRight
                                                                size={15}
                                                            />
                                                        </Link>

                                                        <Link
                                                            href="/my-reviews"
                                                            onClick={closeMenus}
                                                            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-amber-50 hover:text-amber-700"
                                                        >
                                                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                                                <FiStar
                                                                    size={17}
                                                                />
                                                            </span>
                                                            <span className="flex-1">
                                                                My Reviews
                                                            </span>
                                                            <FiArrowUpRight
                                                                size={15}
                                                            />
                                                        </Link>
                                                    </>
                                                )}

                                                {reduxUser?.role !== 'user' && (
                                                    <Link
                                                        href={dashboardHref}
                                                        onClick={closeMenus}
                                                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                                                    >
                                                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                                                            {actionIcon}
                                                        </span>
                                                        <span className="flex-1">
                                                            {dashboardLabel}
                                                        </span>
                                                        <FiArrowUpRight
                                                            size={15}
                                                        />
                                                    </Link>
                                                )}

                                                <Link
                                                    href="/help"
                                                    onClick={closeMenus}
                                                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                                                >
                                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                                                        <FiHelpCircle
                                                            size={17}
                                                        />
                                                    </span>
                                                    <span className="flex-1">
                                                        Help &amp; Support
                                                    </span>
                                                    <FiArrowUpRight size={15} />
                                                </Link>
                                            </div>

                                            <div className="border-t border-slate-100 p-2">
                                                <button
                                                    type="button"
                                                    onClick={handleLogout}
                                                    disabled={isLoggingOut}
                                                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
                                                        <FiLogOut size={17} />
                                                    </span>
                                                    {isLoggingOut
                                                        ? 'Signing out...'
                                                        : 'Sign Out'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/signUp"
                                    onClick={closeMenus}
                                    className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition hover:bg-white/15 ${
                                        isHomeRoute
                                            ? 'text-white'
                                            : 'text-slate-700 hover:text-blue-700'
                                    }`}
                                >
                                    Become a host
                                </Link>

                                <Link
                                    href="/login"
                                    onClick={closeMenus}
                                    className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition ${
                                        isHomeRoute
                                            ? 'text-white hover:bg-white/15'
                                            : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                                    }`}
                                >
                                    Log in
                                </Link>

                                <Link
                                    href="/signUp"
                                    onClick={closeMenus}
                                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-blue-600/35"
                                >
                                    Get Started
                                    <FiArrowUpRight size={16} />
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile hamburger button */}
                    <div className="flex shrink-0 items-center gap-2 lg:hidden">
                        {showAuthActions && isLoggedIn && (
                            <NotificationDropdown isLoggedIn={isLoggedIn} />
                        )}

                        <button
                            type="button"
                            onClick={() =>
                                setIsMenuOpen((previous) => !previous)
                            }
                            aria-label={
                                isMenuOpen
                                    ? 'Close navigation menu'
                                    : 'Open navigation menu'
                            }
                            aria-expanded={isMenuOpen}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-700 shadow-md ring-1 ring-blue-100 transition hover:scale-105 hover:bg-blue-50 sm:h-11 sm:w-11"
                        >
                            {isMenuOpen ? (
                                <FiX size={21} />
                            ) : (
                                <FiMenu size={21} />
                            )}
                        </button>
                    </div>
                </nav>
            </header>

            {/* Mobile backdrop */}
            {isMenuOpen && (
                <button
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={() => setIsMenuOpen(false)}
                    className="fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-sm lg:hidden"
                />
            )}

            {/* Mobile drawer */}
            <aside
                ref={mobileMenuRef}
                aria-label="Mobile navigation"
                aria-hidden={!isMenuOpen}
                className={`fixed inset-y-0 left-0 z-[70] flex w-[min(340px,88vw)] flex-col overflow-y-auto rounded-r-[2rem] border-r border-white/20 bg-slate-950/90 p-5 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out lg:hidden sm:p-6 ${
                    isMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between">
                    <Link
                        href="/"
                        onClick={closeMenus}
                        className="flex items-center gap-2"
                    >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg">
                            <FiCompass size={22} />
                        </span>
                        <span className="text-2xl font-extrabold tracking-tight text-white">
                            tripora<span className="text-blue-400">.</span>
                        </span>
                    </Link>

                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(false)}
                        aria-label="Close navigation menu"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    >
                        <FiX size={22} />
                    </button>
                </div>

                {/* User details in mobile menu */}
                {!showAuthActions ? (
                    <div className="mt-8 h-16 animate-pulse rounded-2xl bg-white/10" />
                ) : isLoggedIn && currentUser ? (
                    <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <ProfileAvatar
                                avatarUrl={currentUser.avatarUrl}
                                name={currentUser.name}
                                size="h-12 w-12"
                            />

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-white">
                                    {currentUser.name}
                                </p>
                                <p className="mt-1 truncate text-xs text-slate-300">
                                    {currentUser.email}
                                </p>
                                <span
                                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ring-1 ${roleBadgeClass}`}
                                >
                                    {currentUser.role}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-4">
                        <p className="text-sm font-semibold text-white">
                            Your next adventure starts here.
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-300">
                            Explore destinations and discover unforgettable
                            experiences.
                        </p>
                    </div>
                )}

                {/* Mobile navigation links */}
                <nav className="mt-8 flex flex-col gap-3">
                    {visibleNavLinks.map((link) => {
                        const active = isActiveLink(link.href);

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={closeMenus}
                                className={`flex items-center justify-between rounded-full px-5 py-3.5 text-sm font-semibold transition-all duration-200 ${
                                    active
                                        ? 'bg-white text-blue-700 shadow-lg'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                {link.label}
                                {active && (
                                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Mobile account actions */}
                <div className="mt-6 border-t border-white/15 pt-5">
                    {showAuthActions && isLoggedIn && currentUser ? (
                        <div className="flex flex-col gap-2">
                            <Link
                                href={dashboardHref}
                                onClick={closeMenus}
                                className="flex items-center gap-3 rounded-full bg-white/10 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20"
                            >
                                {actionIcon}
                                {dashboardLabel}
                            </Link>

                            <Link
                                href="/profile"
                                onClick={closeMenus}
                                className="flex items-center gap-3 rounded-full bg-white/10 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20"
                            >
                                <FiUser size={18} />
                                My Profile
                            </Link>

                            {/* Email verification in mobile menu */}
                            <Link
                                href="/verify-email"
                                onClick={closeMenus}
                                className="flex items-center gap-3 rounded-full bg-white/10 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20"
                            >
                                {currentUser.emailVerified ? (
                                    <FiCheckCircle
                                        size={18}
                                        className="text-emerald-400"
                                    />
                                ) : (
                                    <FiMail
                                        size={18}
                                        className="text-amber-300"
                                    />
                                )}

                                <span className="flex-1">
                                    Email Verification
                                </span>

                                <span
                                    className={`text-xs ${
                                        currentUser.emailVerified
                                            ? 'text-emerald-300'
                                            : 'text-amber-300'
                                    }`}
                                >
                                    {currentUser.emailVerified
                                        ? 'Verified'
                                        : 'Verify'}
                                </span>
                            </Link>

                            <Link
                                href="/wishlist"
                                onClick={closeMenus}
                                className="flex items-center gap-3 rounded-full bg-white/10 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20"
                            >
                                <FiHeart size={18} />
                                My Wishlist
                            </Link>

                            <Link
                                href="/help"
                                onClick={closeMenus}
                                className="flex items-center gap-3 rounded-full bg-white/10 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20"
                            >
                                <FiHelpCircle size={18} />
                                Help &amp; Support
                            </Link>

                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="mt-2 flex items-center gap-3 rounded-full border border-red-300/20 bg-red-500/15 px-5 py-3.5 text-left text-sm font-semibold text-red-200 transition hover:bg-red-500/25 disabled:opacity-50"
                            >
                                <FiLogOut size={18} />
                                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                            </button>
                        </div>
                    ) : showAuthActions ? (
                        <div className="flex flex-col gap-3">
                            <Link
                                href="/signUp"
                                onClick={closeMenus}
                                className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition hover:brightness-110"
                            >
                                Become a host
                                <FiArrowUpRight size={17} />
                            </Link>

                            <div className="grid grid-cols-2 gap-3">
                                <Link
                                    href="/login"
                                    onClick={closeMenus}
                                    className="rounded-full border border-white/20 bg-white/10 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/20"
                                >
                                    Log in
                                </Link>

                                <Link
                                    href="/signUp"
                                    onClick={closeMenus}
                                    className="rounded-full bg-white px-4 py-3 text-center text-sm font-bold text-blue-700 transition hover:bg-blue-50"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="mt-auto pt-8">
                    <div className="flex items-center gap-2 border-t border-white/15 pt-5 text-xs font-medium text-slate-300">
                        <FiCompass
                            size={16}
                            className="shrink-0 text-blue-400"
                        />
                        Discover your next adventure with Tripora
                    </div>
                </div>
            </aside>
        </>
    );
}
