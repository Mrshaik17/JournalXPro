import { useState } from "react";
import AdminLogin from "./AdminLogin";
import AdminLayout from "./AdminLayout";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { supabase } from "@/integrations/supabase/client";


export default function AdminProtected() {
  const [isAuthed, setIsAuthed] = useState(
  sessionStorage.getItem("admin_authed") === "true"
);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");



const handleAdminLogin = async () => {
  setLoginError("");

  try {
    const auth = getAuth();

    // 🔐 Step 1: Firebase login
    const res = await signInWithEmailAndPassword(
      auth,
      loginEmail,
      loginPassword
    );

    const user = res.user;
    console.log("Firebase UID:", user.uid);

    // 🧠 Step 2: Check admin_users table
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("firebase_uid", user.uid)
      .maybeSingle();

    console.log("Admin DB Result:", data);

    if (error) throw error;

    // ❌ Not admin
    if (!data) {
      setLoginError("Not authorized as admin");
      return;
    }

    // ✅ Success
    sessionStorage.setItem("admin_authed", "true");
    setIsAuthed(true);

  } catch (err: any) {
    console.error("Login Error:", err);
    setLoginError(err.message || "Login failed");
  }
};

  const handleAdminLogout = () => {
  sessionStorage.removeItem("admin_authed");

  // 🔥 update state
  setIsAuthed(false);

  // 🔄 optional refresh (safe)
  window.location.reload();
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