import { createContext, useContext, useState } from "react";

const APP_PASSWORD = "cfo2024";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  showLoginModal: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => false,
  logout: () => {},
  openLoginModal: () => {},
  closeLoginModal: () => {},
  showLoginModal: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem("cfo_auth") === "true",
  );
  const [showLoginModal, setShowLoginModal] = useState(false);

  const login = (password: string): boolean => {
    if (password === APP_PASSWORD) {
      sessionStorage.setItem("cfo_auth", "true");
      setIsAuthenticated(true);
      setShowLoginModal(false);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem("cfo_auth");
    setIsAuthenticated(false);
  };

  const openLoginModal = () => setShowLoginModal(true);
  const closeLoginModal = () => setShowLoginModal(false);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        openLoginModal,
        closeLoginModal,
        showLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
