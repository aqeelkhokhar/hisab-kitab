import { useState, useEffect } from 'react';
import { subscribeToMonthlyExpenses, subscribeToIncome } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';

export function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthDateRange(monthStr: string) {
  const [year, month] = monthStr.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

export function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function useMonthlyExpenses(month: string) {
  const { familyId } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) return;
    const { start, end } = getMonthDateRange(month);
    setLoading(true);
    const unsub = subscribeToMonthlyExpenses(familyId, start, end, (data) => {
      setExpenses(data);
      setLoading(false);
    });
    return unsub;
  }, [familyId, month]);

  return { expenses, loading };
}

export function useMonthlyIncome(month: string) {
  const { familyId } = useAuth();
  const [income, setIncome] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) return;
    const unsub = subscribeToIncome(familyId, month, (data) => {
      setIncome(data);
      setLoading(false);
    });
    return unsub;
  }, [familyId, month]);

  return { income, loading };
}
