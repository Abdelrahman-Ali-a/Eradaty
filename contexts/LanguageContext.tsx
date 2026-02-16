import React, { createContext, useContext, useState, useEffect } from "react";

type Direction = "ltr" | "rtl";
type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  "app.name": { en: "Eradaty", ar: "إراداتي" },
  "nav.dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
  "nav.revenue": { en: "Revenue", ar: "الإيرادات" },
  "nav.costs": { en: "Costs", ar: "التكاليف" },
  "nav.wallets": { en: "Wallets", ar: "المحافظ" },
  "nav.salaries": { en: "Salaries", ar: "الرواتب" },
  "nav.finance": { en: "Finance Inputs", ar: "المدخلات المالية" },
  "nav.integrations": { en: "Integrations", ar: "التكاملات" },
  "nav.notifications": { en: "Notifications", ar: "الإشعارات" },
  "nav.profile": { en: "Profile", ar: "الملف الشخصي" },
  "kpi.grossRevenue": { en: "Gross Revenue", ar: "إجمالي الإيرادات" },
  "kpi.netRevenue": { en: "Net Revenue", ar: "صافي الإيرادات" },
  "kpi.totalCosts": { en: "Total Costs", ar: "إجمالي التكاليف" },
  "kpi.profit": { en: "Profit", ar: "الأرباح" },
  "action.add": { en: "Add", ar: "إضافة" },
  "action.edit": { en: "Edit", ar: "تعديل" },
  "action.delete": { en: "Delete", ar: "حذف" },
  "action.view": { en: "View", ar: "عرض" },
  "action.apply": { en: "Apply", ar: "تطبيق" },
  "action.cancel": { en: "Cancel", ar: "إلغاء" },
  "action.save": { en: "Save", ar: "حفظ" },
  "action.connect": { en: "Connect", ar: "ربط" },
  "action.sync": { en: "Sync Now", ar: "مزامنة الآن" },
  "action.login": { en: "Log In", ar: "تسجيل الدخول" },
  "action.signup": { en: "Sign Up", ar: "إنشاء حساب" },
  "action.bulkDelete": { en: "Delete Selected", ar: "حذف المحدد" },
  "action.addRevenue": { en: "Add Revenue", ar: "إضافة إيراد" },
  "action.addCost": { en: "Add Cost", ar: "إضافة تكلفة" },
  "action.addWallet": { en: "Add Wallet", ar: "إضافة محفظة" },
  "action.transfer": { en: "Transfer", ar: "تحويل" },
  "action.approve": { en: "Approve", ar: "قبول" },
  "action.decline": { en: "Decline", ar: "رفض" },
  "action.markRead": { en: "Mark as Read", ar: "تحديد كمقروء" },
  "action.getStarted": { en: "Get Started", ar: "ابدأ الآن" },
  "label.date": { en: "Date", ar: "التاريخ" },
  "label.amount": { en: "Amount", ar: "المبلغ" },
  "label.source": { en: "Source", ar: "المصدر" },
  "label.customer": { en: "Customer", ar: "العميل" },
  "label.description": { en: "Description", ar: "الوصف" },
  "label.category": { en: "Category", ar: "الفئة" },
  "label.vendor": { en: "Vendor", ar: "المورد" },
  "label.recurring": { en: "Recurring", ar: "متكرر" },
  "label.status": { en: "Status", ar: "الحالة" },
  "label.balance": { en: "Balance", ar: "الرصيد" },
  "label.budget": { en: "Budget", ar: "الميزانية" },
  "label.employee": { en: "Employee", ar: "الموظف" },
  "label.salary": { en: "Salary", ar: "الراتب" },
  "label.period": { en: "Period", ar: "الفترة" },
  "label.email": { en: "Email", ar: "البريد الإلكتروني" },
  "label.password": { en: "Password", ar: "كلمة المرور" },
  "label.name": { en: "Name", ar: "الاسم" },
  "label.total": { en: "Total", ar: "الإجمالي" },
  "label.manual": { en: "Manual", ar: "يدوي" },
  "label.shopify": { en: "Shopify", ar: "شوبيفاي" },
  "label.connected": { en: "Connected", ar: "متصل" },
  "label.disconnected": { en: "Disconnected", ar: "غير متصل" },
  "label.lastSynced": { en: "Last synced", ar: "آخر مزامنة" },
  "label.pending": { en: "Pending", ar: "قيد الانتظار" },
  "label.notifications": { en: "Notifications", ar: "الإشعارات" },
  "label.dailyTrend": { en: "Daily Trend", ar: "الاتجاه اليومي" },
  "label.costBreakdown": { en: "Cost Breakdown", ar: "تفصيل التكاليف" },
  "label.equity": { en: "Equity", ar: "رأس المال" },
  "label.workingCapital": { en: "Working Capital", ar: "رأس المال العامل" },
  "label.assets": { en: "Assets", ar: "الأصول" },
  "label.payments": { en: "Payments", ar: "المدفوعات" },
  "label.employees": { en: "Employees", ar: "الموظفون" },
  "label.startDate": { en: "Start Date", ar: "تاريخ البدء" },
  "label.endDate": { en: "End Date", ar: "تاريخ الانتهاء" },
  "label.autoPayment": { en: "Auto Payment", ar: "دفع تلقائي" },
  "label.photo": { en: "Photo", ar: "صورة" },
  "label.menu": { en: "Menu", ar: "القائمة" },
  "label.all": { en: "All", ar: "الكل" },
  "label.unread": { en: "Unread", ar: "غير مقروء" },
  "label.actionRequired": { en: "Action Required", ar: "إجراء مطلوب" },
  "label.profile": { en: "Profile", ar: "الملف الشخصي" },
  "label.brandInfo": { en: "Brand Information", ar: "معلومات العلامة" },
  "label.userInfo": { en: "User Information", ar: "معلومات المستخدم" },
  "label.logo": { en: "Logo", ar: "الشعار" },
  "label.brandName": { en: "Brand Name", ar: "اسم العلامة" },
  "label.phone": { en: "Phone", ar: "الهاتف" },
  "label.role": { en: "Role", ar: "الدور" },
  "label.welcome": { en: "Welcome to Eradaty", ar: "مرحباً بك في إراداتي" },
  "label.onboardingDesc": { en: "Let's set up your account to get started with managing your ecommerce finances.", ar: "لنقم بإعداد حسابك لبدء إدارة ماليات التجارة الإلكترونية." },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("en");
  const direction: Direction = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.setAttribute("dir", direction);
    document.documentElement.setAttribute("lang", language);
  }, [language, direction]);

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
