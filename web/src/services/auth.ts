import { ref } from "vue";
import { api, type AuthUser } from "./api";

const authenticated = ref(false);
const user = ref<AuthUser | null>(null);
const checked = ref(false);

let checkPromise: Promise<boolean> | null = null;

export function useAuth() {
  async function checkAuthentication(): Promise<boolean> {
    if (checkPromise) {
      return checkPromise;
    }

    checkPromise = (async () => {
      try {
        const auth = await api.checkAuth();
        authenticated.value = auth.authenticated;
        user.value = auth.user ?? null;
        checked.value = true;

        return authenticated.value;
      } finally {
        checkPromise = null;
      }
    })();

    return checkPromise;
  }

  return {
    authenticated,
    checked,
    user,
    checkAuthentication,
  };
}
