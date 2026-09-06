import { ref } from "vue";
import { api } from "./api";

const authenticated = ref(false);
const checked = ref(false);

let checkPromise: Promise<boolean> | null = null;

export function useAuth() {
  async function checkAuthentication(): Promise<boolean> {
    if (checkPromise) {
      return checkPromise;
    }

    checkPromise = (async () => {
      try {
        authenticated.value = (await api.checkAuth()).authenticated;
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
    checkAuthentication,
  };
}
