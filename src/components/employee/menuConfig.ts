// Employee Portal navigation, same groups and wording as the Corex web portal
// (RAPP-SLAPP frontend: src/pages/EmployeePortal/menuConfig.js).
// Items without an href are still "Under Development" on the web and show "Soon".
import type { Href } from 'expo-router';
import {
    CalendarCheck, ClipboardCheck, Clock, CreditCard, LayoutDashboard, ListChecks, Network,
    PlaneTakeoff, Receipt, ScrollText, ShieldCheck, Star, User, Users2, Wallet,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

export type MenuItem = { label: string; desc: string; icon: LucideIcon; href?: Href };

export const employeeMenu: MenuItem[] = [
    { label: 'Dashboard', desc: 'Overview & alerts', icon: LayoutDashboard, href: '/(dashboard)/employee-dashboard' },
    { label: 'My Profile', desc: 'Personal details', icon: User, href: '/employee/profile' },
    { label: 'Attendance / Time', desc: 'Daily attendance record', icon: Clock, href: '/employee/attendance' },
    { label: 'Leave Balance', desc: 'Entitlement & used', icon: CalendarCheck, href: '/employee/leave-balance' },
    { label: 'Form 16 / Tax', desc: 'Tax documents', icon: ScrollText },
    { label: 'PF / ESI Details', desc: 'Statutory contributions', icon: ShieldCheck, href: '/employee/pf-esi' },
    { label: 'Loan / Advance Status', desc: 'Outstanding balance & EMI history', icon: CreditCard, href: '/employee/loan-advance-status' },
];

export const requestMenu: MenuItem[] = [
    { label: 'Request Leave', desc: 'Raise a leave request', icon: CalendarCheck, href: '/employee/request-leave' },
    { label: 'Request LTA', desc: 'Raise an LTA request', icon: PlaneTakeoff },
    { label: 'Request Advance', desc: 'Salary / long term advance', icon: Wallet, href: '/employee/request-advance' },
    { label: 'Request Reimbursement', desc: 'Expense claims', icon: Receipt },
    { label: 'My Requests', desc: 'Track status of all requests', icon: ListChecks, href: '/employee/my-requests' },
    { label: 'Reporting Structure', desc: 'Who I report to', icon: Network },
];

export const reportingPersonMenu: MenuItem[] = [
    { label: 'Pending Approvals', desc: 'Verify / accept team requests', icon: ClipboardCheck, href: '/employee/pending-approvals' },
    { label: 'My Reportees', desc: 'Employees reporting to me', icon: Users2, href: '/employee/my-reportees' },
    { label: 'Performance Evaluation', desc: 'Rate & review reportees', icon: Star, href: '/employee/performance-evaluation' },
];
