import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import LandingView from "./views/LandingView.vue";
import App from "./App.vue";
import "./styles/base.css";

const routes = [
  {
    path: "/",
    name: "landing",
    component: LandingView,
    meta: {
      guestOnly: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

const app = createApp(App);

app.use(router);

app.mount("#app");
