// The logged-in employee's identifiers, as the Employee Portal screens need them.
// Login ID (e.g. 52M40005088) differs from EmpRefno (e.g. MS00001): the /HR/GetMy... portal
// endpoints take EmpRefno, while leave types and password changes use the login username.
import { useAppSelector } from '@/src/store/hooks';

export function useEmployee() {
    const employeeData = useAppSelector((state) => state.auth.employeeData);
    const employeeId = useAppSelector((state) => state.auth.employeeId);

    const d = employeeData || {};
    const empRefNo: string = d.EmpRefno || '';
    const username: string = d.Username || employeeId || '';
    const fullName = [d.Firstname, d.Middlename, d.Lastname].map((n: string) => n?.trim()).filter(Boolean).join(' ');
    const initials = [d.Firstname, d.Lastname].filter(Boolean).map((n: string) => n.trim()[0]).join('');

    return { employeeData: d, empRefNo, username, employeeId: employeeId || '', fullName, initials };
}
