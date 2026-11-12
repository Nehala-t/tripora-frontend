'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building2,
    CheckCircle2,
    Eye,
    LayoutDashboard,
    Loader2,
    MapPinned,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    UserCheck,
    Users,
    UserX,
    X,
    AlertTriangle,
    CalendarDays,
    Star,
    FolderTree,
    MapPin,
    Plus,
    Pencil,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import type { AppDispatch, RootState } from '@/redux/store';
import {
    fetchAdminStats,
    fetchAllUsers,
    fetchAllOperators,
    fetchAllTours,
    fetchAllBookings,
    fetchAllReviews,
    updateUserStatus,
    updateOperatorStatus,
    deleteAdminTour,
    clearAdminError,
    clearAdminSuccessMessage,
    fetchAllCategories,
    fetchAllDestinations,
    createCategory,
    updateCategory,
    updateCategoryStatus,
    deleteCategory,
    createDestination,
    updateDestination,
    deleteDestination,
} from '@/redux/slices/adminSlice';

// ============================================
// TYPES
// ============================================

type Tab =
    | 'overview'
    | 'operators'
    | 'users'
    | 'tours'
    | 'bookings'
    | 'reviews'
    | 'categories'
    | 'destinations';

type AccountStatus = 'active' | 'inactive';

type Operator = {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    status?: string;
    role?: string;
    profileImage?: {
        url?: string;
    };
    operatorProfile?: {
        businessName?: string;
        businessEmail?: string;
        businessPhone?: string;
        website?: string;
    };
};

type UserRecord = {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    createdAt?: string;
};

type TourImage = {
    url: string;
    publicId: string;
};

type TourDay = {
    title: string;
    description: string;
    time?: string;
};

type MeetingPoint = {
    name: string;
    address: string;
    instructions?: string;
    coordinates?: {
        lat?: number;
        lng?: number;
    };
};

type TourReference =
    | string
    | {
          _id?: string;
          name?: string;
          firstName?: string;
          lastName?: string;
          businessName?: string;
          operatorProfile?: {
              businessName?: string;
          };
      };

type Tour = {
    _id?: string;
    id?: string;
    operatorId?: TourReference;
    destinationId?: TourReference;
    categoryId?: TourReference;

    title: string;
    slug?: string;
    description: string;

    durationDays?: number;
    nights?: number;
    durationMinutes?: number;

    highlights?: string[];
    days?: TourDay[];
    inclusions?: string[];
    exclusions?: string[];

    meetingPoint?: MeetingPoint;
    whatsappNumber?: string;
    images?: TourImage[];

    basePrice: number;
    currency?: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

    cancellationPolicy?: string;

    minParticipants?: number;
    maxParticipants?: number;

    ageRestrictions?: {
        minAge?: number;
        maxAge?: number | null;
    };

    difficultyLevel?: 'easy' | 'moderate' | 'challenging';
    languages?: string[];
    tags?: string[];
    instantBooking?: boolean;

    status?: 'draft' | 'published' | 'archived';

    averageRating?: number;
    reviewCount?: number;
    isDeleted?: boolean;

    createdAt?: string;
    updatedAt?: string;
};

type BookingRecord = {
    _id?: string;
    id?: string;
    bookingReference?: string;
    participants?: number;
    totalPrice?: number;
    currency?: string;
    status?: string;
    paymentStatus?: string;
    createdAt?: string;
    startAt?: string;
    travelerDetails?: {
        fullName?: string;
        email?: string;
    };
    userId?:
        | {
              firstName?: string;
              lastName?: string;
              name?: string;
              email?: string;
          }
        | string;
    tourId?:
        | {
              title?: string;
          }
        | string;
};

type ReviewRecord = {
    _id?: string;
    id?: string;
    rating?: number;
    comment?: string;
    review?: string;
    status?: string;
    createdAt?: string;
    userId?:
        | {
              firstName?: string;
              lastName?: string;
              name?: string;
              email?: string;
          }
        | string;
    tourId?:
        | {
              title?: string;
          }
        | string;
};

type ConfirmationDialogData = {
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'primary';
    onConfirm: () => Promise<void>;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function recordId(record: { _id?: string; id?: string }): string {
    return record._id || record.id || '';
}

function fullName(record: {
    firstName?: string;
    lastName?: string;
    name?: string;
}): string {
    const name = `${record.firstName || ''} ${record.lastName || ''}`.trim();

    return name || record.name || 'Unnamed';
}

function normalizeStatus(value?: string): string {
    return (value || 'unknown').toLowerCase();
}

function StatusBadge({ status }: { status?: string }) {
    const normalized = normalizeStatus(status);

    const styles: Record<string, string> = {
        active: 'bg-green-100 text-green-700',
        inactive: 'bg-gray-100 text-gray-700',
        suspended: 'bg-red-100 text-red-700',
        published: 'bg-green-100 text-green-700',
        draft: 'bg-gray-100 text-gray-700',
        archived: 'bg-purple-100 text-purple-700',
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
        hidden: 'bg-gray-100 text-gray-700',
        paid: 'bg-green-100 text-green-700',
        failed: 'bg-red-100 text-red-700',
        refunded: 'bg-purple-100 text-purple-700',
        confirmed: 'bg-green-100 text-green-700',
        cancelled: 'bg-red-100 text-red-700',
        completed: 'bg-blue-100 text-blue-700',
    };

    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                styles[normalized] || 'bg-gray-100 text-gray-600'
            }`}
        >
            {normalized.charAt(0).toUpperCase() + normalized.slice(1)}
        </span>
    );
}

function formatDate(value?: string): string {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function destinationName(tour: Tour): string {
    if (typeof tour.destinationId === 'string') {
        return tour.destinationId || '—';
    }

    return tour.destinationId?.name || '—';
}

function operatorName(tour: Tour): string {
    if (!tour.operatorId || typeof tour.operatorId === 'string') {
        return '—';
    }

    return (
        tour.operatorId.operatorProfile?.businessName ||
        fullName(tour.operatorId)
    );
}

function populatedName(
    value: BookingRecord['userId'] | ReviewRecord['userId']
): string {
    if (!value) return '—';

    if (typeof value === 'string') return value;

    return (
        `${value.firstName || ''} ${value.lastName || ''}`.trim() ||
        value.name ||
        value.email ||
        '—'
    );
}

function tourTitle(
    value: BookingRecord['tourId'] | ReviewRecord['tourId']
): string {
    if (!value) return '—';

    if (typeof value === 'string') return value;

    return value.title || '—';
}

function formatCurrency(amount?: number, currency?: string): string {
    if (amount === undefined || amount === null) return '—';

    try {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency || 'INR',
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${currency || 'INR'} ${amount}`;
    }
}

// ============================================
// SEARCH COMPONENT
// ============================================

function SearchBox({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <div className="relative w-full sm:max-w-md">
            <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
        </div>
    );
}

// ============================================
// EMPTY TABLE COMPONENT
// ============================================

function EmptyTable({
    message,
    colSpan,
}: {
    message: string;
    colSpan: number;
}) {
    return (
        <tr>
            <td
                colSpan={colSpan}
                className="px-4 py-12 text-center text-sm text-gray-500"
            >
                {message}
            </td>
        </tr>
    );
}

// ============================================
// CONFIRMATION MODAL
// ============================================

function ConfirmationModal({
    dialog,
    loading,
    onClose,
    onConfirm,
}: {
    dialog: ConfirmationDialogData;
    loading: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    const isDanger = dialog.variant === 'danger';

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
            onClick={loading ? undefined : onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirmation-title"
                className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-start justify-between">
                        <div
                            className={`flex h-12 w-12 items-center justify-center rounded-full ${
                                isDanger
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-blue-100 text-blue-600'
                            }`}
                        >
                            {isDanger ? (
                                <Trash2 size={23} />
                            ) : (
                                <AlertTriangle size={23} />
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                            aria-label="Close confirmation"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <h2
                        id="confirmation-title"
                        className="mt-5 text-xl font-bold text-gray-900"
                    >
                        {dialog.title}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                        {dialog.message}
                    </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            isDanger
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {loading && (
                            <Loader2 size={16} className="animate-spin" />
                        )}
                        {loading ? 'Please wait...' : dialog.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// ADMIN DASHBOARD
// ============================================

export default function AdminDashboardPage() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    const { user, initialized } = useSelector((state: RootState) => state.auth);

    const {
        stats,
        users,
        operators,
        tours,
        bookings,
        reviews,
        loadingStats,
        loadingUsers,
        loadingOperators,
        loadingTours,
        loadingBookings,
        loadingReviews,
        actionLoading,
        error,
        categories,
        destinations,
        loadingCategories,
        loadingDestinations,
        successMessage,
    } = useSelector((state: RootState) => state.admin);

    const validTabs: Tab[] = [
    'overview',
    'operators',
    'users',
    'tours',
    'bookings',
    'reviews',
    'categories',
    'destinations',
];
     const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window === 'undefined') {
        return 'overview';
    }

    const savedTab = localStorage.getItem('adminActiveTab');

    return savedTab && validTabs.includes(savedTab as Tab)
        ? (savedTab as Tab)
        : 'overview';
});
    // ============================================
    // CATEGORY MANAGEMENT STATE
    // ============================================
    const [pendingDestinationDelete, setPendingDestinationDelete] = useState<
        string | null
    >(null);
    const [categorySearch, setCategorySearch] = useState('');

    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
        null
    );

    const [categoryName, setCategoryName] = useState('');
    const [categoryDescription, setCategoryDescription] = useState('');
    const [categoryImage, setCategoryImage] = useState<File | null>(null);

    // ============================================
    // DESTINATION MANAGEMENT STATE
    // ============================================

    const [destinationSearch, setDestinationSearch] = useState('');

    const [editingDestinationId, setEditingDestinationId] = useState<
        string | null
    >(null);
    const [destinationBestTimeToVisit, setDestinationBestTimeToVisit] =
        useState('');
    const [destinationName, setDestinationName] = useState('');
    const [destinationDescription, setDestinationDescription] = useState('');
    const [destinationCountry, setDestinationCountry] = useState('');
    const [destinationRegion, setDestinationRegion] = useState('');
    const [destinationHighlights, setDestinationHighlights] = useState('');
    const [destinationLatitude, setDestinationLatitude] = useState('');
    const [destinationLongitude, setDestinationLongitude] = useState('');
    const [destinationImage, setDestinationImage] = useState<File | null>(null);

    // ============================================
    // LOCAL STATE
    // ============================================
   const [hasRestoredTab, setHasRestoredTab] = useState(false);

    const [operatorSearch, setOperatorSearch] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [tourSearch, setTourSearch] = useState('');

    const [updatingOperatorId, setUpdatingOperatorId] = useState('');
    const [updatingUserId, setUpdatingUserId] = useState('');
    const [deletingTourId, setDeletingTourId] = useState('');

    const [selectedTourId, setSelectedTourId] = useState<string | null>(null);

    const [confirmationDialog, setConfirmationDialog] =
        useState<ConfirmationDialogData | null>(null);

    const [confirmLoading, setConfirmLoading] = useState(false);

    const allUsers = (users || []) as UserRecord[];
    const allOperators = (operators || []) as Operator[];
    const allTours = (tours || []) as Tour[];
    const allBookings = (bookings || []) as BookingRecord[];
    const allReviews = (reviews || []) as ReviewRecord[];

    const selectedTour = allTours.find(
        (tour) => recordId(tour) === selectedTourId
    );

    // ============================================
    // RESTORE ADMIN DASHBOARD TAB
    // ============================================

    useEffect(() => {
        try {
            const savedTab = localStorage.getItem('tripora_admin_active_tab');

            const validTabs: Tab[] = [
                'overview',
                'operators',
                'users',
                'tours',
                'bookings',
                'reviews',
                'categories',
                'destinations',
            ];

        } catch (storageError) {
            console.error(
                'Unable to restore admin dashboard tab:',
                storageError
            );
        } finally {
            setHasRestoredTab(true);
        }
    }, []);

    



    // ============================================
    // SAVE ADMIN DASHBOARD TAB
    // ============================================

    useEffect(() => {
        if (!hasRestoredTab) return;

        try {
            localStorage.setItem('tripora_admin_active_tab', activeTab);
        } catch (storageError) {
            console.error('Unable to save admin dashboard tab:', storageError);
        }
    }, [activeTab, hasRestoredTab]);
    // ============================================
    // TOAST NOTIFICATIONS
    // ============================================

    useEffect(() => {
        if (!error) return;

        toast.error(error);
        dispatch(clearAdminError());
    }, [error, dispatch]);

    useEffect(() => {
        if (!successMessage) return;

        toast.success(successMessage);
        dispatch(clearAdminSuccessMessage());
    }, [successMessage, dispatch]);

    // ============================================
    // LOAD DASHBOARD DATA
    // ============================================

    const loadDashboard = useCallback(() => {
        dispatch(fetchAdminStats());
        dispatch(fetchAllUsers());
        dispatch(fetchAllOperators());
        dispatch(fetchAllTours());
        dispatch(fetchAllBookings());
        dispatch(fetchAllReviews({ page: 1, limit: 10 }));

        // New management data
        dispatch(fetchAllCategories());
        dispatch(fetchAllDestinations());
    }, [dispatch]);

    useEffect(() => {
        if (!initialized) return;

        if (!user) {
            router.replace('/login');
            return;
        }

        if (user.role !== 'admin') {
            router.replace(
                user.role === 'operator'
                    ? '/operator/dashboard'
                    : '/toures&activities'
            );
            return;
        }

        loadDashboard();
    }, [initialized, user, router, loadDashboard]);

    // ============================================
    // FILTER OPERATORS
    // ============================================

    const filteredOperators = useMemo(() => {
        const search = operatorSearch.trim().toLowerCase();

        return allOperators.filter((operator) => {
            const searchableText = [
                fullName(operator),
                operator.email,
                operator.operatorProfile?.businessName,
                operator.operatorProfile?.businessEmail,
                operator.operatorProfile?.businessPhone,
                operator.status,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return searchableText.includes(search);
        });
    }, [allOperators, operatorSearch]);

    // ============================================
    // FILTER USERS
    // ============================================

    const filteredUsers = useMemo(() => {
        const search = userSearch.trim().toLowerCase();

        return allUsers.filter((record) => {
            const searchableText = [
                fullName(record),
                record.email,
                record.role,
                record.status,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return searchableText.includes(search);
        });
    }, [allUsers, userSearch]);

    // ============================================
    // FILTER TOURS
    // ============================================

    const filteredTours = useMemo(() => {
        const search = tourSearch.trim().toLowerCase();

        return allTours.filter((tour) => {
            const searchableText = [
                tour.title,
                tour.slug,
                tour.status,
                destinationName,
                operatorName(tour),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return searchableText.includes(search);
        });
    }, [allTours, tourSearch]);

    // ============================================
    // ACTIVATE / DEACTIVATE OPERATOR
    // ============================================

    const handleOperatorStatus = (operator: Operator) => {
        const operatorId = recordId(operator);

        if (!operatorId) {
            toast.error(
                'Operator ID is missing. Unable to update this account.'
            );
            return;
        }

        const currentStatus = normalizeStatus(operator.status);

        const nextStatus: AccountStatus =
            currentStatus === 'active' ? 'inactive' : 'active';

        const action = nextStatus === 'active' ? 'activate' : 'deactivate';

        setConfirmationDialog({
            title: `${action === 'activate' ? 'Activate' : 'Deactivate'} Operator`,
            message: `Are you sure you want to ${action} the operator account of ${fullName(
                operator
            )}?`,
            confirmLabel: action === 'activate' ? 'Activate' : 'Deactivate',
            variant: action === 'activate' ? 'primary' : 'danger',

            onConfirm: async () => {
                setUpdatingOperatorId(operatorId);

                try {
                    await dispatch(
                        updateOperatorStatus({
                            operatorId,
                            status: nextStatus,
                        })
                    ).unwrap();

                    dispatch(fetchAllOperators());
                    dispatch(fetchAdminStats());
                } finally {
                    setUpdatingOperatorId('');
                }
            },
        });
    };

    // ============================================
    // ACTIVATE / DEACTIVATE USER
    // ============================================

    const handleUserStatus = (record: UserRecord) => {
        const userId = recordId(record);

        if (!userId) {
            toast.error('User ID is missing. Unable to update this account.');
            return;
        }

        const currentStatus = normalizeStatus(record.status);

        const nextStatus: AccountStatus =
            currentStatus === 'active' ? 'inactive' : 'active';

        const action = nextStatus === 'active' ? 'activate' : 'deactivate';

        setConfirmationDialog({
            title: `${action === 'activate' ? 'Activate' : 'Deactivate'} User`,
            message: `Are you sure you want to ${action} the user account of ${fullName(
                record
            )}?`,
            confirmLabel: action === 'activate' ? 'Activate' : 'Deactivate',
            variant: action === 'activate' ? 'primary' : 'danger',

            onConfirm: async () => {
                setUpdatingUserId(userId);

                try {
                    await dispatch(
                        updateUserStatus({
                            userId,
                            status: nextStatus,
                        })
                    ).unwrap();

                    dispatch(fetchAllUsers());
                    dispatch(fetchAdminStats());
                } finally {
                    setUpdatingUserId('');
                }
            },
        });
    };

    // ============================================
    // DELETE TOUR
    // ============================================

    const handleDeleteTour = (tour: Tour) => {
        const tourId = recordId(tour);

        if (!tourId) {
            toast.error('Tour ID is missing. Unable to delete this trip.');
            return;
        }

        setConfirmationDialog({
            title: 'Delete Trip',
            message: `Are you sure you want to permanently delete "${
                tour.title || 'this trip'
            }"? This action cannot be undone.`,
            confirmLabel: 'Delete Trip',
            variant: 'danger',

            onConfirm: async () => {
                setDeletingTourId(tourId);

                try {
                    await dispatch(deleteAdminTour({ tourId })).unwrap();

                    if (selectedTourId === tourId) {
                        setSelectedTourId(null);
                    }

                    dispatch(fetchAllTours());
                    dispatch(fetchAdminStats());
                } finally {
                    setDeletingTourId('');
                }
            },
        });
    };

    // ============================================
    // CATEGORY MANAGEMENT
    // ============================================

    const resetCategoryForm = () => {
        setEditingCategoryId(null);
        setCategoryName('');
        setCategoryDescription('');
        setCategoryImage(null);
    };

    const handleEditCategory = (category: {
        _id: string;
        name: string;
        description?: string;
    }) => {
        setEditingCategoryId(category._id);
        setCategoryName(category.name);
        setCategoryDescription(category.description || '');
        setCategoryImage(null);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCategorySubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!categoryName.trim()) {
            toast.error('Please enter a category name.');
            return;
        }

        // Debug: Check selected image
        console.log('Category image selected:', categoryImage);

        try {
            if (editingCategoryId) {
                console.log('Updating category:', editingCategoryId);

                await dispatch(
                    updateCategory({
                        categoryId: editingCategoryId,
                        name: categoryName.trim(),
                        description: categoryDescription.trim(),
                        ...(categoryImage instanceof File
                            ? { image: categoryImage }
                            : {}),
                    })
                ).unwrap();

                console.log('Category updated successfully');
            } else {
                console.log('Creating new category');

                await dispatch(
                    createCategory({
                        name: categoryName.trim(),
                        description: categoryDescription.trim(),
                        ...(categoryImage instanceof File
                            ? { image: categoryImage }
                            : {}),
                    })
                ).unwrap();

                console.log('Category created successfully');
            }

            resetCategoryForm();

            await dispatch(fetchAllCategories()).unwrap();
        } catch (error) {
            console.error('CATEGORY SUBMISSION ERROR:', error);
        }
    };

    const handleCategoryStatus = async (
        categoryId: string,
        isActive: boolean
    ) => {
        try {
            await dispatch(
                updateCategoryStatus({
                    categoryId,
                    isActive: !isActive,
                })
            ).unwrap();

            dispatch(fetchAllCategories());
        } catch {
            // Redux error is displayed through the existing toast effect.
        }
    };

    const handleDeleteCategory = (categoryId: string) => {
        setConfirmationDialog({
            title: 'Delete Category',
            message:
                'Are you sure you want to delete this category? This action cannot be undone.',
            confirmLabel: 'Delete Category',
            variant: 'danger',

            onConfirm: async () => {
                await dispatch(deleteCategory({ categoryId })).unwrap();

                dispatch(fetchAllCategories());

                if (editingCategoryId === categoryId) {
                    resetCategoryForm();
                }
            },
        });
    };

    const filteredCategories = (categories || []).filter((category) => {
        const search = categorySearch.trim().toLowerCase();

        return (
            category.name.toLowerCase().includes(search) ||
            category.slug.toLowerCase().includes(search)
        );
    });

    // ============================================
    // DESTINATION MANAGEMENT
    // ============================================

    const resetDestinationForm = () => {
        setEditingDestinationId(null);
        setDestinationName('');
        setDestinationDescription('');
        setDestinationCountry('');
        setDestinationRegion('');
        setDestinationBestTimeToVisit('');
        setDestinationHighlights('');
        setDestinationLatitude('');
        setDestinationLongitude('');
        setDestinationImage(null);
    };

    const handleEditDestination = (destination: {
        _id: string;
        name: string;
        description?: string;
        country?: string;
        region?: string;
        bestTimeToVisit?: string;
        highlights?: string[];
        coordinates?: {
            latitude?: number;
            longitude?: number;
            lat?: number;
            lng?: number;
        };
    }) => {
        setEditingDestinationId(destination._id);
        setDestinationName(destination.name);
        setDestinationDescription(destination.description || '');
        setDestinationCountry(destination.country || '');
        setDestinationRegion(destination.region || '');
        setDestinationHighlights((destination.highlights || []).join(', '));
        setDestinationBestTimeToVisit(destination.bestTimeToVisit || '');
        setDestinationLatitude(
            String(
                destination.coordinates?.latitude ??
                    destination.coordinates?.lat ??
                    ''
            )
        );

        setDestinationLongitude(
            String(
                destination.coordinates?.longitude ??
                    destination.coordinates?.lng ??
                    ''
            )
        );

        setDestinationImage(null);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDestinationSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (
            !destinationName.trim() ||
            !destinationDescription.trim() ||
            !destinationCountry.trim()
        ) {
            toast.error(
                'Please enter the destination name, description, and country.'
            );
            return;
        }

        // A destination image is required when creating a new destination.
        // During editing, the existing saved image can be retained.
        if (!editingDestinationId && !destinationImage) {
            toast.error('Please upload a destination image.');
            return;
        }

        // Coordinates are required by the backend.
        if (!destinationLatitude.trim() || !destinationLongitude.trim()) {
            toast.error('Please enter both latitude and longitude.');
            return;
        }

        const latitude = Number(destinationLatitude);
        const longitude = Number(destinationLongitude);

        // Validate latitude
        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
            toast.error('Latitude must be between -90 and 90.');
            return;
        }

        // Validate longitude
        if (
            !Number.isFinite(longitude) ||
            longitude < -180 ||
            longitude > 180
        ) {
            toast.error('Longitude must be between -180 and 180.');
            return;
        }

        const destinationData = {
            name: destinationName.trim(),
            description: destinationDescription.trim(),
            country: destinationCountry.trim(),
            region: destinationRegion.trim(),
            bestTimeToVisit: destinationBestTimeToVisit.trim(),

            coordinates: {
                latitude,
                longitude,
            },

            highlights: destinationHighlights
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),

            ...(destinationImage && {
                image: destinationImage,
            }),
        };

        try {
            if (editingDestinationId) {
                await dispatch(
                    updateDestination({
                        destinationId: editingDestinationId,
                        ...destinationData,
                    })
                ).unwrap();
            } else {
                await dispatch(createDestination(destinationData)).unwrap();
            }

            resetDestinationForm();
            dispatch(fetchAllDestinations());
        } catch {
            // Redux error is displayed through the existing toast effect.
        }
    };
    const handleDeleteDestination = async (destinationId: string) => {
        try {
            await dispatch(deleteDestination({ destinationId })).unwrap();

            dispatch(fetchAllDestinations());
        } catch {
            // Redux error is displayed through the existing toast effect.
            // Keep the modal open if deletion fails.
        }
    };

    const filteredDestinations = (destinations || []).filter((destination) => {
        const search = destinationSearch.trim().toLowerCase();

        return [
            destination.name,
            destination.slug,
            destination.country,
            destination.region,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(search);
    });

    // ============================================
    // CONFIRM MODAL ACTION
    // ============================================

    const handleConfirmAction = async () => {
        if (!confirmationDialog || confirmLoading) return;

        setConfirmLoading(true);

        try {
            await confirmationDialog.onConfirm();
            setConfirmationDialog(null);
        } catch {
            // Redux error is displayed using toast.error().
            // Keep the confirmation modal open so the user can retry.
        } finally {
            setConfirmLoading(false);
        }
    };

    // ============================================
    // LOADING / ACCESS CHECK
    // ============================================

    if (!initialized || (loadingStats && !stats)) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-blue-600" size={36} />
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    // ============================================
    // STATISTICS AND TABS
    // ============================================

    const statCards = [
        {
            label: 'Total Users',
            value: allUsers.length,
            icon: Users,
            color: 'bg-blue-50 text-blue-600',
            tab: 'users' as Tab,
        },
        {
            label: 'Total Operators',
            value: allOperators.length,
            icon: Building2,
            color: 'bg-indigo-50 text-indigo-600',
            tab: 'operators' as Tab,
        },
        {
            label: 'Total Trips',
            value: allTours.length,
            icon: MapPinned,
            color: 'bg-green-50 text-green-600',
            tab: 'tours' as Tab,
        },
    ];

    const tabs: {
        id: Tab;
        label: string;
        icon: typeof Users;
    }[] = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'operators', label: 'Manage Operators', icon: Building2 },
        { id: 'users', label: 'Manage Users', icon: Users },
        { id: 'tours', label: 'Manage Trips', icon: MapPinned },
        { id: 'categories', label: 'Categories', icon: FolderTree },
        { id: 'destinations', label: 'Destinations', icon: MapPin },
        { id: 'bookings', label: 'Bookings', icon: CalendarDays },
        { id: 'reviews', label: 'Reviews', icon: Star },
    ];

    // ============================================
    // RENDER
    // ============================================

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 pb-8 pt-28 sm:px-6 sm:pt-32 lg:px-8">
                {/* PAGE HEADER */}

                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                            <ShieldCheck size={18} />
                            Tripora Administration
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                            Admin Dashboard
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Manage users, operators, and trips from one place.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={loadDashboard}
                        disabled={
                            loadingStats ||
                            loadingUsers ||
                            loadingOperators ||
                            loadingTours
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw
                            size={16}
                            className={
                                loadingStats ||
                                loadingUsers ||
                                loadingOperators ||
                                loadingTours
                                    ? 'animate-spin'
                                    : ''
                            }
                        />
                        Refresh
                    </button>
                </div>

                {/* STATISTICS */}

                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {statCards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <button
                                key={card.label}
                                type="button"
                                onClick={() => setActiveTab(card.tab)}
                                className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-500">
                                        {card.label}
                                    </span>

                                    <span
                                        className={`rounded-xl p-2.5 ${card.color}`}
                                    >
                                        <Icon size={21} />
                                    </span>
                                </div>

                                <p className="mt-4 text-3xl font-bold text-gray-900">
                                    {card.value}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* NAVIGATION TABS */}

                <div className="mb-6 overflow-x-auto border-b border-gray-200">
                    <nav
                        className="flex min-w-max gap-6"
                        aria-label="Admin sections"
                    >
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`inline-flex items-center gap-2 border-b-2 px-1 pb-4 text-sm font-semibold transition ${
                                        isActive
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    <Icon size={17} />
                                    {tab.label}

                                    {tab.id === 'operators' && (
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                            {allOperators.length}
                                        </span>
                                    )}

                                    {tab.id === 'users' && (
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                            {allUsers.length}
                                        </span>
                                    )}

                                    {tab.id === 'bookings' && (
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                            {allBookings.length}
                                        </span>
                                    )}

                                    {tab.id === 'reviews' && (
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                            {allReviews.length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* ====================================== */}
                {/* OVERVIEW */}
                {/* ====================================== */}

             
{activeTab === 'overview' && (
    <section className="space-y-6">
        {/* OVERVIEW HEADER */}
        <div>
            <h2 className="text-lg font-bold text-gray-900">
                Dashboard Overview
            </h2>
            <p className="mt-1 text-sm text-gray-500">
                Monitor and manage your Tripora marketplace from one place.
            </p>
        </div>

        {/* OVERVIEW STATISTICS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* OPERATORS */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Total Operators
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {allOperators.length}
                        </p>
                    </div>
                    <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                        <Building2 size={22} />
                    </span>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                    {allOperators.filter(
                        (operator) =>
                            normalizeStatus(operator.status) === 'active'
                    ).length} active accounts
                </p>

                <button
                    type="button"
                    onClick={() => setActiveTab('operators')}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                    Manage Operators →
                </button>
            </div>

            {/* USERS */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Total Users
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {allUsers.length}
                        </p>
                    </div>
                    <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
                        <Users size={22} />
                    </span>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                    Registered travelers
                </p>

                <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                    Manage Users →
                </button>
            </div>

            {/* TRIPS */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Total Trips
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {allTours.length}
                        </p>
                    </div>
                    <span className="rounded-xl bg-green-50 p-3 text-green-600">
                        <MapPinned size={22} />
                    </span>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                    {allTours.filter(
                        (tour) => normalizeStatus(tour.status) === 'published'
                    ).length} published trips
                </p>

                <button
                    type="button"
                    onClick={() => setActiveTab('tours')}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                    Manage Trips →
                </button>
            </div>

            {/* CATEGORIES */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Categories
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {categories.length}
                        </p>
                    </div>
                    <span className="rounded-xl bg-purple-50 p-3 text-purple-600">
                        <FolderTree size={22} />
                    </span>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                    Available activity categories
                </p>

                <button
                    type="button"
                    onClick={() => setActiveTab('categories')}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                    Manage Categories →
                </button>
            </div>

            {/* DESTINATIONS */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Destinations
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {destinations.length}
                        </p>
                    </div>
                    <span className="rounded-xl bg-orange-50 p-3 text-orange-600">
                        <MapPin size={22} />
                    </span>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                    Travel destinations available
                </p>

                <button
                    type="button"
                    onClick={() => setActiveTab('destinations')}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                    Manage Destinations →
                </button>
            </div>

            {/* BOOKINGS */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Total Bookings
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {allBookings.length}
                        </p>
                    </div>
                    <span className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
                        <CalendarDays size={22} />
                    </span>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                    {allBookings.filter(
                        (booking) =>
                            normalizeStatus(booking.status) === 'confirmed'
                    ).length} confirmed bookings
                </p>

                <button
                    type="button"
                    onClick={() => setActiveTab('bookings')}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                    Manage Bookings →
                </button>
            </div>

            {/* REVIEWS */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Total Reviews
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {allReviews.length}
                        </p>
                    </div>
                    <span className="rounded-xl bg-amber-50 p-3 text-amber-600">
                        <Star size={22} />
                    </span>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                    {allReviews.filter(
                        (review) =>
                            normalizeStatus(review.status) === 'pending'
                    ).length} reviews awaiting moderation
                </p>

                <button
                    type="button"
                    onClick={() => setActiveTab('reviews')}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                    Manage Reviews →
                </button>
            </div>

        </div>
    </section>
)}


                {/* ====================================== */}
                {/* MANAGE OPERATORS */}
                {/* ====================================== */}

                {activeTab === 'operators' && (
                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Manage Operators
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Search operators and manage their account
                                    access.
                                </p>
                            </div>

                            <SearchBox
                                value={operatorSearch}
                                onChange={setOperatorSearch}
                                placeholder="Search name, email, or business..."
                            />
                        </div>

                        {/* OPERATOR COUNTS */}

                        <div className="grid grid-cols-1 gap-3 border-b border-gray-100 bg-gray-50/70 p-4 sm:grid-cols-3">
                            <div className="rounded-xl border border-gray-200 bg-white p-3">
                                <p className="text-xs font-medium text-gray-500">
                                    Total Operators
                                </p>
                                <p className="mt-1 text-xl font-bold text-gray-900">
                                    {allOperators.length}
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-3">
                                <p className="text-xs font-medium text-gray-500">
                                    Active Accounts
                                </p>
                                <p className="mt-1 text-xl font-bold text-green-700">
                                    {
                                        allOperators.filter(
                                            (operator) =>
                                                normalizeStatus(
                                                    operator.status
                                                ) === 'active'
                                        ).length
                                    }
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-3">
                                <p className="text-xs font-medium text-gray-500">
                                    Inactive Accounts
                                </p>
                                <p className="mt-1 text-xl font-bold text-gray-700">
                                    {
                                        allOperators.filter(
                                            (operator) =>
                                                normalizeStatus(
                                                    operator.status
                                                ) === 'inactive'
                                        ).length
                                    }
                                </p>
                            </div>
                        </div>

                        {/* OPERATORS TABLE */}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold">
                                            Operator
                                        </th>
                                        <th className="px-5 py-4 font-semibold">
                                            Business
                                        </th>
                                        <th className="px-5 py-4 font-semibold">
                                            Contact
                                        </th>
                                        <th className="px-5 py-4 font-semibold">
                                            Account Status
                                        </th>
                                        <th className="px-5 py-4 text-right font-semibold">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {loadingOperators &&
                                    allOperators.length === 0 ? (
                                        <EmptyTable
                                            message="Loading operators..."
                                            colSpan={5}
                                        />
                                    ) : filteredOperators.length === 0 ? (
                                        <EmptyTable
                                            message={
                                                operatorSearch
                                                    ? 'No operators match your search.'
                                                    : 'No operators found.'
                                            }
                                            colSpan={5}
                                        />
                                    ) : (
                                        filteredOperators.map((operator) => {
                                            const id = recordId(operator);
                                            const isUpdating =
                                                updatingOperatorId === id;

                                            return (
                                                <tr
                                                    key={id || operator.email}
                                                    className="transition hover:bg-gray-50/80"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {operator
                                                                .profileImage
                                                                ?.url ? (
                                                                <img
                                                                    src={
                                                                        operator
                                                                            .profileImage
                                                                            .url
                                                                    }
                                                                    alt=""
                                                                    className="h-10 w-10 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700">
                                                                    {fullName(
                                                                        operator
                                                                    )
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase()}
                                                                </div>
                                                            )}

                                                            <div>
                                                                <p className="font-semibold text-gray-900">
                                                                    {fullName(
                                                                        operator
                                                                    )}
                                                                </p>
                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    {operator.email ||
                                                                        'No email'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <p className="font-medium text-gray-800">
                                                            {operator
                                                                .operatorProfile
                                                                ?.businessName ||
                                                                'Not provided'}
                                                        </p>

                                                        {operator
                                                            .operatorProfile
                                                            ?.website && (
                                                            <a
                                                                href={
                                                                    operator
                                                                        .operatorProfile
                                                                        .website
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                                                            >
                                                                Visit website
                                                            </a>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4 text-gray-600">
                                                        <p>
                                                            {operator
                                                                .operatorProfile
                                                                ?.businessEmail ||
                                                                operator.email ||
                                                                '—'}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {operator
                                                                .operatorProfile
                                                                ?.businessPhone ||
                                                                'No phone'}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <StatusBadge
                                                            status={
                                                                operator.status
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-5 py-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleOperatorStatus(
                                                                    operator
                                                                )
                                                            }
                                                            disabled={
                                                                isUpdating ||
                                                                actionLoading
                                                            }
                                                            className={`inline-flex min-w-[118px] items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                                                normalizeStatus(
                                                                    operator.status
                                                                ) === 'active'
                                                                    ? 'border border-red-200 bg-white text-red-600 hover:bg-red-50'
                                                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                                            }`}
                                                        >
                                                            {isUpdating ? (
                                                                <Loader2
                                                                    size={14}
                                                                    className="animate-spin"
                                                                />
                                                            ) : normalizeStatus(
                                                                  operator.status
                                                              ) === 'active' ? (
                                                                <UserX
                                                                    size={14}
                                                                />
                                                            ) : (
                                                                <UserCheck
                                                                    size={14}
                                                                />
                                                            )}

                                                            {normalizeStatus(
                                                                operator.status
                                                            ) === 'active'
                                                                ? 'Deactivate'
                                                                : 'Activate'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500">
                            Showing {filteredOperators.length} of{' '}
                            {allOperators.length} operators
                        </div>
                    </section>
                )}

                {/* ====================================== */}
                {/* MANAGE USERS */}
                {/* ====================================== */}

                {activeTab === 'users' && (
                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Manage Users
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Search users and manage their account
                                    status.
                                </p>
                            </div>

                            <SearchBox
                                value={userSearch}
                                onChange={setUserSearch}
                                placeholder="Search users by name, email, or status..."
                            />
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold">
                                            User
                                        </th>
                                        <th className="px-5 py-4 font-semibold">
                                            Role
                                        </th>
                                        <th className="px-5 py-4 font-semibold">
                                            Status
                                        </th>
                                        <th className="px-5 py-4 font-semibold">
                                            Joined
                                        </th>
                                        <th className="px-5 py-4 text-right font-semibold">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {loadingUsers && allUsers.length === 0 ? (
                                        <EmptyTable
                                            message="Loading users..."
                                            colSpan={5}
                                        />
                                    ) : filteredUsers.length === 0 ? (
                                        <EmptyTable
                                            message={
                                                userSearch
                                                    ? 'No users match your search.'
                                                    : 'No users found.'
                                            }
                                            colSpan={5}
                                        />
                                    ) : (
                                        filteredUsers.map((record) => {
                                            const id = recordId(record);
                                            const isUpdating =
                                                updatingUserId === id;

                                            return (
                                                <tr
                                                    key={id || record.email}
                                                    className="transition hover:bg-gray-50/80"
                                                >
                                                    <td className="px-5 py-4">
                                                        <p className="font-semibold text-gray-900">
                                                            {fullName(record)}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {record.email ||
                                                                'No email'}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4 capitalize text-gray-600">
                                                        {record.role || 'user'}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <StatusBadge
                                                            status={
                                                                record.status
                                                            }
                                                        />
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                                                        {formatDate(
                                                            record.createdAt
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleUserStatus(
                                                                    record
                                                                )
                                                            }
                                                            disabled={
                                                                isUpdating ||
                                                                actionLoading
                                                            }
                                                            className={`inline-flex min-w-[118px] items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                                                normalizeStatus(
                                                                    record.status
                                                                ) === 'active'
                                                                    ? 'border border-red-200 bg-white text-red-600 hover:bg-red-50'
                                                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                                            }`}
                                                        >
                                                            {isUpdating ? (
                                                                <Loader2
                                                                    size={14}
                                                                    className="animate-spin"
                                                                />
                                                            ) : normalizeStatus(
                                                                  record.status
                                                              ) === 'active' ? (
                                                                <UserX
                                                                    size={14}
                                                                />
                                                            ) : (
                                                                <UserCheck
                                                                    size={14}
                                                                />
                                                            )}

                                                            {normalizeStatus(
                                                                record.status
                                                            ) === 'active'
                                                                ? 'Deactivate'
                                                                : 'Activate'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500">
                            Showing {filteredUsers.length} of {allUsers.length}{' '}
                            users
                        </div>
                    </section>
                )}

                {/* ====================================== */}
                {/* MANAGE TRIPS */}
                {/* ====================================== */}

                {activeTab === 'tours' && (
                    <section className="space-y-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Manage Trips
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Browse, view and manage all marketplace
                                    trips.
                                </p>
                            </div>

                            <SearchBox
                                value={tourSearch}
                                onChange={setTourSearch}
                                placeholder="Search by tour, destination, or operator..."
                            />
                        </div>

                        {loadingTours && allTours.length === 0 ? (
                            <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-16">
                                <Loader2
                                    className="mr-2 animate-spin text-blue-600"
                                    size={22}
                                />
                                <span className="text-sm text-gray-500">
                                    Loading trips...
                                </span>
                            </div>
                        ) : filteredTours.length === 0 ? (
                            <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
                                <MapPinned
                                    className="mx-auto mb-3 text-gray-400"
                                    size={36}
                                />

                                <h3 className="font-semibold text-gray-800">
                                    {tourSearch
                                        ? 'No trips match your search'
                                        : 'No trips found'}
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    Try searching with another tour or
                                    destination name.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredTours.map((tour) => {
                                    const id = recordId(tour);
                                    const isDeleting = deletingTourId === id;

                                    return (
                                        <div
                                            key={id || tour.slug}
                                            className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                                        >
                                            <div className="relative h-52 overflow-hidden bg-gray-100">
                                                {tour.images?.[0]?.url ? (
                                                    <img
                                                        src={tour.images[0].url}
                                                        alt={
                                                            tour.title ||
                                                            'Tour image'
                                                        }
                                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center">
                                                        <MapPinned
                                                            size={42}
                                                            className="text-gray-300"
                                                        />
                                                    </div>
                                                )}

                                                <div className="absolute left-3 top-3">
                                                    <StatusBadge
                                                        status={tour.status}
                                                    />
                                                </div>

                                                {tour.images &&
                                                    tour.images.length > 0 && (
                                                        <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                                                            {tour.images.length}{' '}
                                                            Photos
                                                        </div>
                                                    )}
                                            </div>

                                            <div className="space-y-4 p-5">
                                                <div>
                                                    <h3 className="line-clamp-1 text-lg font-bold text-gray-900">
                                                        {tour.title ||
                                                            'Untitled trip'}
                                                    </h3>

                                                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                                        <MapPinned
                                                            size={15}
                                                            className="shrink-0 text-blue-600"
                                                        />
                                                        <span className="line-clamp-1">
                                                            {destinationName}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className="line-clamp-2 min-h-10 text-sm leading-5 text-gray-500">
                                                    {tour.description ||
                                                        'No description available.'}
                                                </p>

                                                <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3">
                                                    <div>
                                                        <p className="text-xs text-gray-400">
                                                            Duration
                                                        </p>
                                                        <p className="mt-1 text-sm font-semibold text-gray-800">
                                                            {tour.durationDays
                                                                ? `${tour.durationDays} days`
                                                                : tour.durationMinutes
                                                                  ? `${Math.round(
                                                                        tour.durationMinutes /
                                                                            60
                                                                    )} hours`
                                                                  : 'Not set'}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-gray-400">
                                                            Price
                                                        </p>
                                                        <p className="mt-1 text-sm font-semibold text-gray-800">
                                                            {tour.basePrice !==
                                                            undefined
                                                                ? new Intl.NumberFormat(
                                                                      'en-IN',
                                                                      {
                                                                          style: 'currency',
                                                                          currency:
                                                                              tour.currency ||
                                                                              'INR',
                                                                          maximumFractionDigits: 2,
                                                                      }
                                                                  ).format(
                                                                      Number(
                                                                          tour.basePrice
                                                                      )
                                                                  )
                                                                : '—'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-gray-400">
                                                    Created:{' '}
                                                    {formatDate(tour.createdAt)}
                                                </p>

                                                <div className="flex gap-3 border-t border-gray-100 pt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedTourId(
                                                                id
                                                            )
                                                        }
                                                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                                                    >
                                                        <Eye size={16} />
                                                        View Details
                                                    </button>

                                                    <button
                                                        type="button"
                                                        title="Delete trip"
                                                        onClick={() =>
                                                            handleDeleteTour(
                                                                tour
                                                            )
                                                        }
                                                        disabled={
                                                            isDeleting ||
                                                            actionLoading
                                                        }
                                                        className="flex items-center justify-center rounded-xl border border-red-200 px-4 py-2.5 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {isDeleting ? (
                                                            <Loader2
                                                                size={18}
                                                                className="animate-spin"
                                                            />
                                                        ) : (
                                                            <Trash2 size={18} />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="text-sm text-gray-500">
                            Showing {filteredTours.length} of {allTours.length}{' '}
                            trips
                        </div>

                        {/* TOUR DETAILS MODAL */}

                        {selectedTour && (
                            <div
                                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                                onClick={() => setSelectedTourId(null)}
                            >
                                <div
                                    className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-5">
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">
                                                Trip Details
                                            </h2>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Complete information about this
                                                trip.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedTourId(null)
                                            }
                                            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                                            aria-label="Close trip details"
                                        >
                                            <span className="text-2xl leading-none">
                                                ×
                                            </span>
                                        </button>
                                    </div>

                                    <div className="space-y-6 p-5 sm:p-6">
                                        {selectedTour.images &&
                                            selectedTour.images.length > 0 && (
                                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                                    {selectedTour.images.map(
                                                        (image, index) => (
                                                            <img
                                                                key={
                                                                    image.publicId ||
                                                                    index
                                                                }
                                                                src={image.url}
                                                                alt={`${selectedTour.title || 'Trip'} ${
                                                                    index + 1
                                                                }`}
                                                                className="h-36 w-full rounded-xl object-cover"
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            )}

                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {selectedTour.title ||
                                                        'Untitled trip'}
                                                </h3>
                                                <StatusBadge
                                                    status={selectedTour.status}
                                                />
                                            </div>

                                            <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                                <MapPinned
                                                    size={16}
                                                    className="text-blue-600"
                                                />
                                                {destinationName}{' '}
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="mb-2 font-semibold text-gray-900">
                                                Description
                                            </h3>
                                            <p className="whitespace-pre-line text-sm leading-6 text-gray-600">
                                                {selectedTour.description ||
                                                    'No description available.'}
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="mb-3 font-semibold text-gray-900">
                                                Basic Information
                                            </h3>

                                            <div className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
                                                <div>
                                                    <p className="text-xs text-gray-400">
                                                        Destination
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-gray-800">
                                                        {destinationName}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-gray-400">
                                                        Price
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-gray-800">
                                                        {selectedTour.basePrice !==
                                                        undefined
                                                            ? new Intl.NumberFormat(
                                                                  'en-IN',
                                                                  {
                                                                      style: 'currency',
                                                                      currency:
                                                                          selectedTour.currency ||
                                                                          'INR',
                                                                      maximumFractionDigits: 2,
                                                                  }
                                                              ).format(
                                                                  Number(
                                                                      selectedTour.basePrice
                                                                  )
                                                              )
                                                            : '—'}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-gray-400">
                                                        Duration
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-gray-800">
                                                        {selectedTour.durationDays
                                                            ? `${selectedTour.durationDays} days`
                                                            : selectedTour.durationMinutes
                                                              ? `${selectedTour.durationMinutes} minutes`
                                                              : 'Not set'}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-gray-400">
                                                        Difficulty
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium capitalize text-gray-800">
                                                        {selectedTour.difficultyLevel ||
                                                            'Not specified'}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-gray-400">
                                                        Category
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-gray-800">
                                                        {typeof selectedTour.categoryId ===
                                                        'object'
                                                            ? selectedTour
                                                                  .categoryId
                                                                  ?.name ||
                                                              'Not specified'
                                                            : 'Not specified'}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-gray-400">
                                                        Minimum Participants
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-gray-800">
                                                        {selectedTour.minParticipants ??
                                                            'Not specified'}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-gray-400">
                                                        Maximum Participants
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-gray-800">
                                                        {selectedTour.maxParticipants ??
                                                            'Not specified'}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-gray-400">
                                                        Instant Booking
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-gray-800">
                                                        {selectedTour.instantBooking
                                                            ? 'Enabled'
                                                            : 'Disabled'}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-gray-400">
                                                        Created At
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-gray-800">
                                                        {formatDate(
                                                            selectedTour.createdAt
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedTour.highlights &&
                                            selectedTour.highlights.length >
                                                0 && (
                                                <div>
                                                    <h3 className="mb-3 font-semibold text-gray-900">
                                                        Highlights
                                                    </h3>

                                                    <ul className="space-y-2">
                                                        {selectedTour.highlights.map(
                                                            (item, index) => (
                                                                <li
                                                                    key={index}
                                                                    className="flex items-start gap-2 text-sm text-gray-600"
                                                                >
                                                                    <CheckCircle2
                                                                        size={
                                                                            16
                                                                        }
                                                                        className="mt-0.5 shrink-0 text-green-600"
                                                                    />
                                                                    {item}
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            )}

                                        {selectedTour.days &&
                                            selectedTour.days.length > 0 && (
                                                <div>
                                                    <h3 className="mb-3 font-semibold text-gray-900">
                                                        Itinerary
                                                    </h3>

                                                    <div className="space-y-3">
                                                        {selectedTour.days.map(
                                                            (item, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="rounded-xl border border-gray-200 p-4"
                                                                >
                                                                    <p className="font-semibold text-gray-800">
                                                                        {item.title ||
                                                                            `Day ${index + 1}`}
                                                                    </p>

                                                                    {item.time && (
                                                                        <p className="mt-1 text-xs font-medium text-blue-600">
                                                                            {
                                                                                item.time
                                                                            }
                                                                        </p>
                                                                    )}

                                                                    <p className="mt-1 text-sm leading-6 text-gray-600">
                                                                        {
                                                                            item.description
                                                                        }
                                                                    </p>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                            {selectedTour.inclusions &&
                                                selectedTour.inclusions.length >
                                                    0 && (
                                                    <div>
                                                        <h3 className="mb-3 font-semibold text-gray-900">
                                                            Inclusions
                                                        </h3>

                                                        <ul className="space-y-2">
                                                            {selectedTour.inclusions.map(
                                                                (
                                                                    item,
                                                                    index
                                                                ) => (
                                                                    <li
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="text-sm text-gray-600"
                                                                    >
                                                                        ✓ {item}
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}

                                            {selectedTour.exclusions &&
                                                selectedTour.exclusions.length >
                                                    0 && (
                                                    <div>
                                                        <h3 className="mb-3 font-semibold text-gray-900">
                                                            Exclusions
                                                        </h3>

                                                        <ul className="space-y-2">
                                                            {selectedTour.exclusions.map(
                                                                (
                                                                    item,
                                                                    index
                                                                ) => (
                                                                    <li
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="text-sm text-gray-600"
                                                                    >
                                                                        • {item}
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                            {selectedTour.languages &&
                                                selectedTour.languages.length >
                                                    0 && (
                                                    <div>
                                                        <h3 className="mb-2 font-semibold text-gray-900">
                                                            Languages
                                                        </h3>

                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedTour.languages.map(
                                                                (
                                                                    language,
                                                                    index
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                                                                    >
                                                                        {
                                                                            language
                                                                        }
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                            {selectedTour.tags &&
                                                selectedTour.tags.length >
                                                    0 && (
                                                    <div>
                                                        <h3 className="mb-2 font-semibold text-gray-900">
                                                            Tags
                                                        </h3>

                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedTour.tags.map(
                                                                (
                                                                    tag,
                                                                    index
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                        </div>

                                        {selectedTour.meetingPoint && (
                                            <div>
                                                <h3 className="mb-2 font-semibold text-gray-900">
                                                    Meeting Point
                                                </h3>

                                                <div className="rounded-xl bg-gray-50 p-4">
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {
                                                            selectedTour
                                                                .meetingPoint
                                                                .name
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-sm text-gray-600">
                                                        {
                                                            selectedTour
                                                                .meetingPoint
                                                                .address
                                                        }
                                                    </p>

                                                    {selectedTour.meetingPoint
                                                        .instructions && (
                                                        <p className="mt-2 text-sm text-gray-500">
                                                            {
                                                                selectedTour
                                                                    .meetingPoint
                                                                    .instructions
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="sticky bottom-0 flex justify-end border-t border-gray-100 bg-white p-5">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedTourId(null)
                                            }
                                            className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* ====================================== */}
                {/* MANAGE CATEGORIES */}
                {/* ====================================== */}

                {activeTab === 'categories' && (
                    <section className="space-y-6">
                        {/* CATEGORY FORM */}
                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 bg-gray-50 px-6 py-5">
                                <h2 className="text-lg font-bold text-gray-900">
                                    {editingCategoryId
                                        ? 'Edit Category'
                                        : 'Create Category'}
                                </h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Manage activity categories available in
                                    Tripora.
                                </p>
                            </div>

                            <form
                                onSubmit={handleCategorySubmit}
                                className="space-y-5 p-6"
                            >
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    {/* CATEGORY NAME */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                                            Category Name{' '}
                                            <span className="text-red-600">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            type="text"
                                            value={categoryName}
                                            onChange={(event) =>
                                                setCategoryName(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Example: Adventure"
                                            required
                                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-600 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    {/* CATEGORY IMAGE */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                                            Category Image
                                        </label>

                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(event) =>
                                                setCategoryImage(
                                                    event.target.files?.[0] ||
                                                        null
                                                )
                                            }
                                            className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                                        />

                                        <p className="mt-2 text-xs text-gray-600">
                                            Optional. Choose an image for this
                                            category.
                                        </p>
                                    </div>
                                </div>

                                {/* DESCRIPTION */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                                        Description
                                    </label>

                                    <textarea
                                        value={categoryDescription}
                                        onChange={(event) =>
                                            setCategoryDescription(
                                                event.target.value
                                            )
                                        }
                                        rows={4}
                                        placeholder="Describe this category..."
                                        className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-600 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                {/* FORM BUTTONS */}
                                <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5">
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {actionLoading ? (
                                            <Loader2
                                                size={17}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Plus size={17} />
                                        )}

                                        {editingCategoryId
                                            ? 'Update Category'
                                            : 'Create Category'}
                                    </button>

                                    {editingCategoryId && (
                                        <button
                                            type="button"
                                            onClick={resetCategoryForm}
                                            className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-100"
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* CATEGORY LIST */}
                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            {/* TABLE HEADER */}
                            <div className="flex flex-col gap-4 border-b border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        All Categories
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Manage, edit and update your activity
                                        categories.
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-gray-800">
                                        {categories.length} categories available
                                    </p>
                                </div>

                                <div className="w-full sm:w-72">
                                    <SearchBox
                                        value={categorySearch}
                                        onChange={setCategorySearch}
                                        placeholder="Search categories..."
                                    />
                                </div>
                            </div>

                            {/* TABLE */}
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[750px] text-left text-sm">
                                    <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-700">
                                        <tr>
                                            <th className="px-6 py-4">
                                                Category
                                            </th>
                                            <th className="px-6 py-4">Slug</th>
                                            <th className="px-6 py-4">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {loadingCategories &&
                                        categories.length === 0 ? (
                                            <EmptyTable
                                                message="Loading categories..."
                                                colSpan={4}
                                            />
                                        ) : filteredCategories.length === 0 ? (
                                            <EmptyTable
                                                message="No categories found."
                                                colSpan={4}
                                            />
                                        ) : (
                                            filteredCategories.map(
                                                (category) => {
                                                    const imageUrl =
                                                        typeof category.image ===
                                                        'string'
                                                            ? category.image
                                                            : category.image
                                                                  ?.url;

                                                    return (
                                                        <tr
                                                            key={category._id}
                                                            className="transition hover:bg-blue-50/40"
                                                        >
                                                            {/* CATEGORY */}
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    {imageUrl ? (
                                                                        <img
                                                                            src={
                                                                                imageUrl
                                                                            }
                                                                            alt={
                                                                                category.name
                                                                            }
                                                                            className="h-12 w-12 rounded-xl border border-gray-200 object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                                                                            <FolderTree
                                                                                size={
                                                                                    21
                                                                                }
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    <div className="min-w-0">
                                                                        <p className="font-semibold text-gray-900">
                                                                            {
                                                                                category.name
                                                                            }
                                                                        </p>

                                                                        <p className="mt-1 max-w-xs truncate text-xs text-gray-600">
                                                                            {category.description ||
                                                                                'No description added'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* SLUG */}
                                                            <td className="px-6 py-4">
                                                                <span className="rounded-md bg-gray-100 px-2.5 py-1 font-medium text-gray-800">
                                                                    {
                                                                        category.slug
                                                                    }
                                                                </span>
                                                            </td>

                                                            {/* STATUS */}
                                                            <td className="px-6 py-4">
                                                                <StatusBadge
                                                                    status={
                                                                        category.isActive
                                                                            ? 'active'
                                                                            : 'inactive'
                                                                    }
                                                                />
                                                            </td>

                                                            {/* ACTIONS */}
                                                            <td className="px-6 py-4">
                                                                <div className="flex justify-end gap-2">
                                                                    {/* EDIT */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleEditCategory(
                                                                                category
                                                                            )
                                                                        }
                                                                        title="Edit category"
                                                                        className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                                                                    >
                                                                        <Pencil
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                    </button>

                                                                    {/* ACTIVATE / DEACTIVATE */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleCategoryStatus(
                                                                                category._id,
                                                                                category.isActive
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            actionLoading
                                                                        }
                                                                        title={
                                                                            category.isActive
                                                                                ? 'Deactivate category'
                                                                                : 'Activate category'
                                                                        }
                                                                        className={`rounded-lg border px-3 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                                            category.isActive
                                                                                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                                                                : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                                                                        }`}
                                                                    >
                                                                        {category.isActive
                                                                            ? 'Deactivate'
                                                                            : 'Activate'}
                                                                    </button>

                                                                    {/* DELETE */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleDeleteCategory(
                                                                                category._id
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            actionLoading
                                                                        }
                                                                        title="Delete category"
                                                                        className="rounded-lg border border-red-200 bg-white p-2.5 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >
                                                                        <Trash2
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* TABLE FOOTER */}
                            <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs font-medium text-gray-700">
                                    Showing {filteredCategories.length} of{' '}
                                    {categories.length} categories
                                </p>
                                <p className="text-xs text-gray-600">
                                    Category management
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* ====================================== */}
                {/* MANAGE DESTINATIONS */}
                {/* ====================================== */}

                {activeTab === 'destinations' && (
                    <section className="space-y-6">
                        {/* DESTINATION FORM */}

                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                            <div className="mb-5">
                                <h2 className="text-lg font-bold text-gray-900">
                                    {editingDestinationId
                                        ? 'Edit Destination'
                                        : 'Create Destination'}
                                </h2>

                                <p className="mt-1 text-sm text-gray-600">
                                    Add and manage travel destinations on
                                    Tripora.
                                </p>
                            </div>

                            <form
                                onSubmit={handleDestinationSubmit}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {/* DESTINATION NAME */}

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                                            Destination Name *
                                        </label>

                                        <input
                                            type="text"
                                            value={destinationName}
                                            onChange={(event) =>
                                                setDestinationName(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Example: Bali"
                                            required
                                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    {/* COUNTRY */}

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                                            Country *
                                        </label>

                                        <input
                                            type="text"
                                            value={destinationCountry}
                                            onChange={(event) =>
                                                setDestinationCountry(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Example: Indonesia"
                                            required
                                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    {/* REGION */}

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                                            Region
                                        </label>

                                        <input
                                            type="text"
                                            value={destinationRegion}
                                            onChange={(event) =>
                                                setDestinationRegion(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Example: Southeast Asia"
                                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                    {/* BEST TIME TO VISIT */}

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                                            Best Time to Visit
                                        </label>

                                        <input
                                            type="text"
                                            value={destinationBestTimeToVisit}
                                            onChange={(event) =>
                                                setDestinationBestTimeToVisit(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Example: April to October"
                                            maxLength={200}
                                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    {/* DESTINATION IMAGE */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                                            Destination Image{' '}
                                            {!editingDestinationId && '*'}
                                        </label>

                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(event) =>
                                                setDestinationImage(
                                                    event.target.files?.[0] ||
                                                        null
                                                )
                                            }
                                            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-medium file:text-blue-700"
                                        />

                                        {/* Existing image preview */}
                                        {editingDestinationId &&
                                            !destinationImage &&
                                            (() => {
                                                const destination =
                                                    destinations.find(
                                                        (item) =>
                                                            item._id ===
                                                            editingDestinationId
                                                    );

                                                const currentImage =
                                                    typeof destination?.image ===
                                                    'string'
                                                        ? destination.image
                                                        : destination?.image
                                                              ?.url;

                                                return currentImage ? (
                                                    <div className="mt-3">
                                                        <p className="mb-2 text-xs font-medium text-gray-600">
                                                            Current destination
                                                            image
                                                        </p>

                                                        <img
                                                            src={currentImage}
                                                            alt={`${destination?.name || 'Destination'} image`}
                                                            className="h-24 w-32 rounded-xl border border-gray-200 object-cover"
                                                        />
                                                    </div>
                                                ) : null;
                                            })()}
                                    </div>
                                </div>

                                {/* DESCRIPTION */}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                                        Description *
                                    </label>

                                    <textarea
                                        value={destinationDescription}
                                        onChange={(event) =>
                                            setDestinationDescription(
                                                event.target.value
                                            )
                                        }
                                        rows={3}
                                        required
                                        placeholder="Describe the destination..."
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                {/* HIGHLIGHTS */}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                                        Highlights
                                    </label>

                                    <input
                                        type="text"
                                        value={destinationHighlights}
                                        onChange={(event) =>
                                            setDestinationHighlights(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Beaches, Temples, Waterfalls"
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                    />

                                    <p className="mt-1 text-xs text-gray-500">
                                        Separate highlights with commas.
                                    </p>
                                </div>

                                {/* COORDINATES */}

                                <div>
                                    <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                        Coordinates *
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-800">
                                                Latitude *
                                            </label>

                                            <input
                                                type="number"
                                                step="any"
                                                value={destinationLatitude}
                                                onChange={(event) =>
                                                    setDestinationLatitude(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="-8.4095"
                                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-800">
                                                Longitude *
                                            </label>

                                            <input
                                                type="number"
                                                step="any"
                                                value={destinationLongitude}
                                                onChange={(event) =>
                                                    setDestinationLongitude(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="115.1889"
                                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* FORM BUTTONS */}

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {actionLoading ? (
                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Plus size={16} />
                                        )}

                                        {editingDestinationId
                                            ? 'Update Destination'
                                            : 'Create Destination'}
                                    </button>

                                    {editingDestinationId && (
                                        <button
                                            type="button"
                                            onClick={resetDestinationForm}
                                            className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* DESTINATION LIST */}

                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        All Destinations
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-600">
                                        {destinations.length} destinations
                                        available.
                                    </p>
                                </div>

                                <SearchBox
                                    value={destinationSearch}
                                    onChange={setDestinationSearch}
                                    placeholder="Search destination or country..."
                                />
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px] text-left text-sm">
                                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                                        <tr>
                                            <th className="px-5 py-4">
                                                Destination
                                            </th>
                                            <th className="px-5 py-4">
                                                Country
                                            </th>
                                            <th className="px-5 py-4">
                                                Region
                                            </th>
                                            <th className="px-5 py-4">
                                                Status
                                            </th>
                                            <th className="px-5 py-4 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {loadingDestinations &&
                                        destinations.length === 0 ? (
                                            <EmptyTable
                                                message="Loading destinations..."
                                                colSpan={5}
                                            />
                                        ) : filteredDestinations.length ===
                                          0 ? (
                                            <EmptyTable
                                                message="No destinations found."
                                                colSpan={5}
                                            />
                                        ) : (
                                            filteredDestinations.map(
                                                (destination) => {
                                                    const imageUrl =
                                                        typeof destination.image ===
                                                        'string'
                                                            ? destination.image
                                                            : destination.image
                                                                  ?.url;

                                                    return (
                                                        <tr
                                                            key={
                                                                destination._id
                                                            }
                                                            className="transition hover:bg-gray-50"
                                                        >
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    {imageUrl ? (
                                                                        <img
                                                                            src={
                                                                                imageUrl
                                                                            }
                                                                            alt={
                                                                                destination.name
                                                                            }
                                                                            className="h-12 w-14 rounded-xl object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex h-12 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                                                            <MapPin
                                                                                size={
                                                                                    20
                                                                                }
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    <div>
                                                                        <p className="font-semibold text-gray-900">
                                                                            {
                                                                                destination.name
                                                                            }
                                                                        </p>

                                                                        <p className="mt-1 text-xs text-gray-600">
                                                                            {
                                                                                destination.slug
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td className="px-5 py-4 text-gray-800">
                                                                {destination.country ||
                                                                    '—'}
                                                            </td>

                                                            <td className="px-5 py-4 text-gray-800">
                                                                {destination.region ||
                                                                    '—'}
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <StatusBadge
                                                                    status={
                                                                        destination.status
                                                                    }
                                                                />
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <div className="flex justify-end gap-2">
                                                                    {/* EDIT */}

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleEditDestination(
                                                                                destination
                                                                            )
                                                                        }
                                                                        title="Edit destination"
                                                                        className="rounded-lg border border-gray-200 p-2 text-blue-600 transition hover:bg-blue-50"
                                                                    >
                                                                        <Pencil
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                    </button>

                                                                    {/* DELETE - OPEN MODAL */}

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setPendingDestinationDelete(
                                                                                destination._id
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            actionLoading
                                                                        }
                                                                        title="Delete destination"
                                                                        className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                                                    >
                                                                        <Trash2
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t border-gray-200 px-5 py-4 text-xs text-gray-600">
                                Showing {filteredDestinations.length} of{' '}
                                {destinations.length} destinations
                            </div>
                        </div>

                        {/* DELETE CONFIRMATION MODAL */}

                        {pendingDestinationDelete && (
                            <div
                                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                                onClick={() => {
                                    if (!actionLoading) {
                                        setPendingDestinationDelete(null);
                                    }
                                }}
                            >
                                <div
                                    role="dialog"
                                    aria-modal="true"
                                    aria-labelledby="delete-destination-title"
                                    className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    {/* MODAL ICON */}

                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                                        <Trash2
                                            size={26}
                                            className="text-red-600"
                                        />
                                    </div>

                                    {/* MODAL CONTENT */}

                                    <div className="text-center">
                                        <h3
                                            id="delete-destination-title"
                                            className="text-lg font-bold text-gray-900"
                                        >
                                            Delete Destination?
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-gray-600">
                                            Are you sure you want to delete this
                                            destination? This action cannot be
                                            undone.
                                        </p>
                                    </div>

                                    {/* MODAL BUTTONS */}

                                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={() =>
                                                setPendingDestinationDelete(
                                                    null
                                                )
                                            }
                                            className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={() => {
                                                if (pendingDestinationDelete) {
                                                    handleDeleteDestination(
                                                        pendingDestinationDelete
                                                    );
                                                }
                                            }}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {actionLoading ? (
                                                <Loader2
                                                    size={16}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                            Delete Destination
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* ====================================== */}
                {/* MANAGE BOOKINGS */}
                {/* ====================================== */}

                {activeTab === 'bookings' && (
                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 p-5 sm:p-6">
                            <h2 className="text-lg font-bold text-gray-900">
                                Manage Bookings
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                View all customer bookings and payment
                                information.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-5 py-4">
                                            Booking Reference
                                        </th>
                                        <th className="px-5 py-4">Traveler</th>
                                        <th className="px-5 py-4">Tour</th>
                                        <th className="px-5 py-4">
                                            Participants
                                        </th>
                                        <th className="px-5 py-4">
                                            Total Price
                                        </th>
                                        <th className="px-5 py-4">Payment</th>
                                        <th className="px-5 py-4">
                                            Booking Status
                                        </th>
                                        <th className="px-5 py-4">Created</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {loadingBookings &&
                                    allBookings.length === 0 ? (
                                        <EmptyTable
                                            message="Loading bookings..."
                                            colSpan={8}
                                        />
                                    ) : allBookings.length === 0 ? (
                                        <EmptyTable
                                            message="No bookings found."
                                            colSpan={8}
                                        />
                                    ) : (
                                        allBookings.map((booking) => (
                                            <tr
                                                key={
                                                    recordId(booking) ||
                                                    booking.bookingReference
                                                }
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-5 py-4 font-semibold text-blue-600">
                                                    {booking.bookingReference ||
                                                        recordId(booking) ||
                                                        '—'}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-gray-900">
                                                        {booking.travelerDetails
                                                            ?.fullName ||
                                                            populatedName(
                                                                booking.userId
                                                            )}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {booking.travelerDetails
                                                            ?.email ||
                                                            (typeof booking.userId ===
                                                            'object'
                                                                ? booking.userId
                                                                      ?.email
                                                                : '') ||
                                                            '—'}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4 text-gray-700">
                                                    {tourTitle(booking.tourId)}
                                                </td>

                                                <td className="px-5 py-4 text-gray-700">
                                                    {booking.participants ??
                                                        '—'}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-800">
                                                    {formatCurrency(
                                                        booking.totalPrice,
                                                        booking.currency
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <StatusBadge
                                                        status={
                                                            booking.paymentStatus
                                                        }
                                                    />
                                                </td>

                                                <td className="px-5 py-4">
                                                    <StatusBadge
                                                        status={booking.status}
                                                    />
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                                                    {formatDate(
                                                        booking.createdAt
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500">
                            Showing {allBookings.length} bookings
                        </div>
                    </section>
                )}

                {/* ====================================== */}
                {/* MANAGE REVIEWS */}
                {/* ====================================== */}

                {activeTab === 'reviews' && (
                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 p-5 sm:p-6">
                            <h2 className="text-lg font-bold text-gray-900">
                                Manage Reviews
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                View customer ratings and review moderation
                                statuses.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 border-b border-gray-100 bg-gray-50/70 p-4 sm:grid-cols-4">
                            {(
                                [
                                    'pending',
                                    'approved',
                                    'rejected',
                                    'hidden',
                                ] as const
                            ).map((status) => {
                                const count = allReviews.filter(
                                    (review) =>
                                        normalizeStatus(review.status) ===
                                        status
                                ).length;

                                return (
                                    <div
                                        key={status}
                                        className="rounded-xl border border-gray-200 bg-white p-3"
                                    >
                                        <p className="text-xs font-medium capitalize text-gray-500">
                                            {status} Reviews
                                        </p>
                                        <p className="mt-1 text-xl font-bold text-gray-900">
                                            {count}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-5 py-4">Reviewer</th>
                                        <th className="px-5 py-4">Tour</th>
                                        <th className="px-5 py-4">Rating</th>
                                        <th className="px-5 py-4">Review</th>
                                        <th className="px-5 py-4">Status</th>
                                        <th className="px-5 py-4">Submitted</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {loadingReviews &&
                                    allReviews.length === 0 ? (
                                        <EmptyTable
                                            message="Loading reviews..."
                                            colSpan={6}
                                        />
                                    ) : allReviews.length === 0 ? (
                                        <EmptyTable
                                            message="No reviews found."
                                            colSpan={6}
                                        />
                                    ) : (
                                        allReviews.map((review) => (
                                            <tr
                                                key={recordId(review)}
                                                className="align-top hover:bg-gray-50"
                                            >
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-gray-900">
                                                        {populatedName(
                                                            review.userId
                                                        )}
                                                    </p>

                                                    {typeof review.userId ===
                                                        'object' && (
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {review.userId
                                                                ?.email || ''}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-gray-700">
                                                    {tourTitle(review.tourId)}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4">
                                                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                                                        <Star
                                                            size={15}
                                                            fill="currentColor"
                                                        />
                                                        {review.rating ?? '—'}/5
                                                    </span>
                                                </td>

                                                <td className="max-w-sm px-5 py-4">
                                                    <p className="line-clamp-3 text-sm leading-5 text-gray-600">
                                                        {review.comment ||
                                                            review.review ||
                                                            'No review text'}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <StatusBadge
                                                        status={review.status}
                                                    />
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                                                    {formatDate(
                                                        review.createdAt
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500">
                            Showing {allReviews.length} reviews
                        </div>
                    </section>
                )}

                {/* ====================================== */}
                {/* CONFIRMATION MODAL */}
                {/* ====================================== */}

                {confirmationDialog && (
                    <ConfirmationModal
                        dialog={confirmationDialog}
                        loading={confirmLoading}
                        onClose={() => {
                            if (!confirmLoading) {
                                setConfirmationDialog(null);
                            }
                        }}
                        onConfirm={handleConfirmAction}
                    />
                )}
            </div>
            {confirmationDialog && (
                <ConfirmationModal
                    dialog={confirmationDialog}
                    loading={confirmLoading}
                    onClose={() => {
                        if (!confirmLoading) {
                            setConfirmationDialog(null);
                        }
                    }}
                    onConfirm={handleConfirmAction}
                />
            )}
        </main>
    );
}
