// OnlyFlix PWA registration. The app shell is cached; live catalogue/API calls remain network-driven.
if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js", { scope: "./" })
      .catch((error) => console.warn("OnlyFlix offline support could not be enabled:", error));
  });
}
