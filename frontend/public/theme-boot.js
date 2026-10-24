(function () {
  try {
    var saved = localStorage.getItem("resqsync-appearance-v1");
    if (saved !== "light" && saved !== "dark") return;
    document.documentElement.dataset.theme = saved;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = saved === "light" ? "#f4f0e8" : "#161612";
  } catch (e) {}
})();
