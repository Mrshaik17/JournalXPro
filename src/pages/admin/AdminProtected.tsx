import { useState } from "react";
import AdminLogin from "./AdminLogin";
import AdminLayout from "./AdminLayout";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./adminConfig";

export default function AdminProtected() {
  const [isAuthed, setIsAuthed] = useState(
    () => sessionStorage.getItem("admin_authed") === "true"
  );
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleAdminLogin = () => {
    if (loginEmail === ADMIN_EMAIL && loginPassword === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_authed", "true");
      setIsAuthed(true);
      setLoginError("");
    } else {
      setLoginError("Invalid credentials.");
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("admin_authed");
    setIsAuthed(false);
  };

  if (!isAuthed) {
    return (
      <AdminLogin
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginError={loginError}
        handleAdminLogin={handleAdminLogin}
      />
    );
  }

  return <AdminLayout handleAdminLogout={handleAdminLogout} />;
}