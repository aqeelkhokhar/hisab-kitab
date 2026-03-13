import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  familyId: string | null;
  memberId: string | null;
  memberName: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (familyId: string, memberId: string, memberName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  familyId: null,
  memberId: null,
  memberName: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    familyId: null,
    memberId: null,
    memberName: null,
    isLoading: true,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const familyId = await AsyncStorage.getItem('familyId');
      const memberId = await AsyncStorage.getItem('memberId');
      const memberName = await AsyncStorage.getItem('memberName');

      if (familyId && memberId && memberName) {
        setState({ familyId, memberId, memberName, isLoading: false });
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }

  async function login(familyId: string, memberId: string, memberName: string) {
    await AsyncStorage.setItem('familyId', familyId);
    await AsyncStorage.setItem('memberId', memberId);
    await AsyncStorage.setItem('memberName', memberName);
    setState({ familyId, memberId, memberName, isLoading: false });
  }

  async function logout() {
    await AsyncStorage.multiRemove(['familyId', 'memberId', 'memberName']);
    setState({ familyId: null, memberId: null, memberName: null, isLoading: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
