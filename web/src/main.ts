import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import LandingView from "./views/LandingView.vue";
import AuthView from "./views/AuthView.vue";
import DashboardView from "./views/DashboardView.vue";
import NotFoundView from "./views/NotFoundView.vue";
import App from "./App.vue";
import "./styles/base.css";
import { useAuth } from "./services/auth";

const routes = [
  {
    path: "/",
    name: "landing",
    component: LandingView,
    meta: {
      guestOnly: true,
    },
  },

  {
    path: "/auth",
    name: "auth",
    component: AuthView,
    meta: {
      guestOnly: true,
    },
  },

  {
    path: "/dashboard",
    name: "dashboard",
    component: DashboardView,
    meta: {
      requiresAuth: true,
    },
  },

  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundView,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

const { authenticated, checked, checkAuthentication } = useAuth();

router.beforeEach(async (to) => {
  if (!checked.value) {
    await checkAuthentication();
  }

  if (to.meta.requiresAuth && !authenticated.value) {
    return { name: "auth" };
  }

  if (to.meta.guestOnly && authenticated.value) {
    return { name: "dashboard" };
  }

  return true;
});

const app = createApp(App);

app.use(router);

app.mount("#app");
