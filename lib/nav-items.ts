import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardCheck,
  User,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types/domain";

export interface NavItem {
  href: string;
  labelEn: string;
  labelAr: string;
  icon: LucideIcon;
}

export function getAppNavItems(role: UserRole): NavItem[] {
  const common: NavItem[] = [{ href: "/app/profile", labelEn: "Profile", labelAr: "الملف الشخصي", icon: User }];

  if (role === "student") {
    return [
      { href: "/app/student", labelEn: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
      { href: "/app/student/attendance", labelEn: "Attendance", labelAr: "الحضور", icon: ClipboardCheck },
      { href: "/app/labs", labelEn: "Labs", labelAr: "Labs", icon: FlaskConical },
      ...common,
    ];
  }

  if (role === "instructor") {
    return [
      { href: "/app/instructor", labelEn: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
      { href: "/app/instructor/courses", labelEn: "Courses", labelAr: "الدورات", icon: BookOpen },
      { href: "/app/instructor/attendance", labelEn: "Attendance", labelAr: "الحضور", icon: ClipboardCheck },
      { href: "/app/labs", labelEn: "Labs", labelAr: "Labs", icon: FlaskConical },
      ...common,
    ];
  }

  return [
    { href: "/app/admin", labelEn: "Overview", labelAr: "نظرة عامة", icon: LayoutDashboard },
    { href: "/app/admin/courses", labelEn: "Courses", labelAr: "الدورات", icon: BookOpen },
    { href: "/app/admin/users", labelEn: "Users", labelAr: "المستخدمون", icon: Users },
    { href: "/app/admin/attendance", labelEn: "Attendance", labelAr: "الحضور", icon: ClipboardCheck },
    { href: "/app/labs", labelEn: "Labs", labelAr: "Labs", icon: FlaskConical },
    ...common,
  ];
}
