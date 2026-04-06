import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const syncUserProfile = async (firebaseUser: User) => {
  try {
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("firebase_uid", firebaseUser.uid)
      .maybeSingle();

    if (fetchError) {
      console.error("Profile fetch error:", fetchError);
      return;
    }

    const profilePayload = {
      firebase_uid: firebaseUser.uid,
      email: firebaseUser.email ?? "",
      full_name: firebaseUser.displayName ?? "",
      avatar_url: firebaseUser.photoURL ?? "",
      updated_at: new Date().toISOString(),
    };

    if (!existingProfile) {
      const { error: insertError } = await supabase.from("profiles").insert({
        ...profilePayload,
        role: "user",
        plan_name: "free",
        is_active: true,
      });

      if (insertError) {
        console.error("Profile insert error:", insertError);
      } else {
        console.log("Profile created successfully");
      }
    } else {
      const { error: updateError } = await supabase
        .from("profiles")
        .update(profilePayload)
        .eq("firebase_uid", firebaseUser.uid);

      if (updateError) {
        console.error("Profile update error:", updateError);
      } else {
        console.log("Profile updated successfully");
      }
    }
  } catch (error) {
    console.error("Unexpected profile sync error:", error);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        await syncUserProfile(firebaseUser);
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