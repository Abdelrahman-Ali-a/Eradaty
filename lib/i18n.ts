export const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    revenue: "Revenue",
    costs: "Costs",
    wallets: "Wallets",
    salaries: "Salaries",
    finance: "Finance",
    integrations: "Integrations",
    profile: "Profile",
    signOut: "Sign out",
    signIn: "Sign in",
    signUp: "Sign up",
    
    // Welcome
    welcomeBack: "Welcome back,",
    
    // Profile
    userInformation: "User Information",
    brandInformation: "Brand Information",
    fullName: "Full Name",
    email: "Email",
    memberSince: "Member Since",
    brandName: "Brand Name",
    description: "Description",
    created: "Created",
    editBrandProfile: "Edit Brand Profile",
    brandLogo: "Brand Logo",
    uploadLogo: "Upload Logo",
    saveChanges: "Save Changes",
    saving: "Saving...",
    profileUpdated: "Profile updated successfully!",
    manageAccount: "Manage your account and brand information",
    notSet: "Not set",
    
    // Common
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    add: "Add",
    search: "Search",
    filter: "Filter",
    export: "Export",
    import: "Import",
    
    // Notifications
    notifications: "Notifications",
    markAsRead: "Mark as read",
    markAllRead: "Mark all as read",
    viewAll: "View all",
    noNotifications: "No notifications",
    
    // Theme
    lightMode: "Light mode",
    darkMode: "Dark mode",
    
    // Language
    language: "Language",
    english: "English",
    arabic: "Arabic",
  },
  ar: {
    // Navigation
    dashboard: "لوحة التحكم",
    revenue: "الإيرادات",
    costs: "التكاليف",
    wallets: "المحافظ",
    salaries: "الرواتب",
    finance: "المالية",
    integrations: "التكاملات",
    profile: "الملف الشخصي",
    signOut: "تسجيل الخروج",
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    
    // Welcome
    welcomeBack: "مرحباً بعودتك،",
    
    // Profile
    userInformation: "معلومات المستخدم",
    brandInformation: "معلومات العلامة التجارية",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    memberSince: "عضو منذ",
    brandName: "اسم العلامة التجارية",
    description: "الوصف",
    created: "تم الإنشاء",
    editBrandProfile: "تعديل الملف الشخصي للعلامة التجارية",
    brandLogo: "شعار العلامة التجارية",
    uploadLogo: "رفع الشعار",
    saveChanges: "حفظ التغييرات",
    saving: "جاري الحفظ...",
    profileUpdated: "تم تحديث الملف الشخصي بنجاح!",
    manageAccount: "إدارة حسابك ومعلومات علامتك التجارية",
    notSet: "غير محدد",
    
    // Common
    loading: "جاري التحميل...",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    view: "عرض",
    add: "إضافة",
    search: "بحث",
    filter: "تصفية",
    export: "تصدير",
    import: "استيراد",
    
    // Notifications
    notifications: "الإشعارات",
    markAsRead: "وضع علامة كمقروء",
    markAllRead: "وضع علامة على الكل كمقروء",
    viewAll: "عرض الكل",
    noNotifications: "لا توجد إشعارات",
    
    // Theme
    lightMode: "الوضع الفاتح",
    darkMode: "الوضع الداكن",
    
    // Language
    language: "اللغة",
    english: "English",
    arabic: "العربية",
  },
};

export type Language = "en" | "ar";
export type TranslationKey = keyof typeof translations.en;
