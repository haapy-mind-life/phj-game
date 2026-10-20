import { familyAuthPassword } from "@/game/family-pin";
import type { ReactNode } from "react";
import type { Nickname } from "@/game/family-room";
import { familyIdentity } from "@/game/family-identity";
import {
  createContext,
  createElement,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { familyClient, familyConfig } from "@/lib/family-supabase";
import { parseMembership, type FamilyMembership } from "@/game/family-config";
function useAccountState() {
  const [previewNickname, setPreviewNickname] = useState<Nickname>("현준");
  const [status, setStatus] = useState<"loading" | "signed-out" | "ready" | "not-member" | "error">(
    familyClient ? "loading" : "signed-out",
  );
  const [membership, setMembership] = useState<FamilyMembership | null>(null),
    [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const reload = useRef<(session: Session | null) => Promise<void>>(async () => {});
  useEffect(() => {
    if (!familyClient) return;
    const client = familyClient;
    let alive = true,
      request = 0,
      validatedUser: string | null = null;
    const load = async (session: Session | null) => {
      const mine = ++request;
      if (!alive) return;
      setMembership(null);
      setError(null);
      if (!session) {
        validatedUser = null;
        setStatus("signed-out");
        return;
      }
      setStatus("loading");
      try {
        const { data, error: problem } = await client
          .from("family_members")
          .select("family_id,nickname")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (!alive || mine !== request) return;
        if (problem) throw problem;
        const member = parseMembership(data);
        if (!member) {
          setStatus("not-member");
          setError("부모님이 이 계정을 가족으로 등록해 주세요.");
          return;
        }
        validatedUser = session.user.id;
        setMembership(member);
        setStatus("ready");
      } catch {
        if (alive && mine === request) {
          setStatus("error");
          setError("가족 정보를 확인하지 못했어요. 잠시 후 다시 연결해 주세요.");
        }
      }
    };
    reload.current = load;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      // Keep database/SDK work out of the auth callback lock. Token refresh preserves membership/room.
      if (
        event === "TOKEN_REFRESHED" ||
        (event === "SIGNED_IN" && session?.user.id === validatedUser)
      )
        return;
      queueMicrotask(() => {
        if (alive) void load(session);
      });
    });
    void client.auth
      .getSession()
      .then(({ data, error: problem }) => {
        if (!alive) return;
        if (problem) {
          setStatus("error");
          setError("로그인을 확인하지 못했어요. 다시 로그인해 주세요.");
          return;
        }
        void load(data.session);
      })
      .catch(() => {
        if (alive) {
          setStatus("error");
          setError("연결을 확인해 주세요. 혼자 놀기는 계속할 수 있어요.");
        }
      });
    return () => {
      alive = false;
      request++;
      subscription.unsubscribe();
      reload.current = async () => {};
    };
  }, []);
  const signIn = useCallback(async (email: string, password: string) => {
    if (!familyClient) return false;
    setBusy(true);
    setError(null);
    try {
      const { error: problem } = await familyClient.auth.signInWithPassword({
        email: email.trim(),
        password: familyAuthPassword(password),
      });
      if (problem) {
        setError("선택한 가족과 암호를 확인해 주세요.");
        return false;
      }
      return true;
    } catch {
      setError("연결하지 못했어요. 인터넷 연결을 확인해 주세요.");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);
  const signOut = useCallback(async () => {
    if (!familyClient) return;
    setBusy(true);
    setError(null);
    try {
      const { error: problem } = await familyClient.auth.signOut({ scope: "local" });
      if (problem) throw problem;
      setMembership(null);
      setStatus("signed-out");
    } catch {
      setError("로그아웃하지 못했어요. 연결 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }, []);
  const retry = useCallback(async () => {
    if (!familyClient) return;
    try {
      const { data } = await familyClient.auth.getSession();
      await reload.current(data.session);
    } catch {
      setError("연결을 다시 확인해 주세요.");
    }
  }, []);
  return {
    previewNickname,
    setPreviewNickname,
    mode: familyConfig.mode,
    status,
    membership,
    error,
    busy,
    signIn,
    signOut,
    retry,
  };
}

const AccountContext = createContext<ReturnType<typeof useAccountState> | null>(null);
export function FamilyAccountProvider({ children }: { children: ReactNode }) {
  const account = useAccountState();
  return createElement(AccountContext.Provider, { value: account }, children);
}
export function useFamilyAccount() {
  const account = useContext(AccountContext);
  if (!account) throw new Error("FamilyAccountProvider is required");
  return account;
}
export function usePlayerIdentity() {
  const account = useFamilyAccount();
  return familyIdentity(
    account.membership?.nickname ?? (account.mode === "local" ? account.previewNickname : null),
  );
}
