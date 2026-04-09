import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { supabase } from "@/integrations/supabase/client";


// ✅ FIXED USER TYPE (VERY IMPORTANT)
interface AppUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);


// 🔥 PROFILE SYNC (KEEP SAME)
const syncUserProfile = async (firebaseUser: FirebaseUser) => {
  try {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", firebaseUser.uid)
      .maybeSingle();

    const profilePayload = {
      user_id: firebaseUser.uid,  
      email: firebaseUser.email ?? "",
      full_name: firebaseUser.displayName ?? "",
      avatar_url: firebaseUser.photoURL ?? "",
      updated_at: new Date().toISOString(),
    };

    if (!existingProfile) {
      await supabase.from("profiles").insert({
        ...profilePayload,
        role: "user",
        plan_name: "free",
        is_active: true,
      });
      console.log("Profile created");
    } else {
      await supabase
        .from("profiles")
        .update(profilePayload)
        .eq("user_id", firebaseUser.uid);

      console.log("Profile updated");
    }
  } catch (error) {
    console.error("Profile sync error:", error);
  }
};


// 🔥 MAIN PROVIDER (FIXED)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {

      if (firebaseUser) {

        // ✅ THIS IS THE MAIN FIX
        const appUser: AppUser = {
          id: firebaseUser.uid,        // 🔥 NOW YOU HAVE user.id
          email: firebaseUser.email ?? "",
        };

        setUser(appUser);

        await syncUserProfile(firebaseUser);

        console.log("AUTH USER:", appUser);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};