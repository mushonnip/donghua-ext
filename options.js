(() => {
  const ext = typeof browser !== "undefined" ? browser : chrome;
  const input = document.getElementById("apiAuth");
  const status = document.getElementById("status");
  const saveBtn = document.getElementById("saveBtn");

  function storageGet(key) {
    try {
      const maybe = ext.storage.local.get(key);
      if (maybe && typeof maybe.then === "function") return maybe;
      return new Promise((resolve) => ext.storage.local.get(key, resolve));
    } catch (err) {
      return Promise.resolve({});
    }
  }

  function storageSet(obj) {
    try {
      const maybe = ext.storage.local.set(obj);
      if (maybe && typeof maybe.then === "function") return maybe;
      return new Promise((resolve) => ext.storage.local.set(obj, resolve));
    } catch (err) {
      return Promise.resolve();
    }
  }

  async function load() {
    const data = await storageGet("api_auth");
    input.value = data.api_auth || "";
  }

  async function save() {
    await storageSet({ api_auth: input.value.trim() });
    status.textContent = "Saved";
    setTimeout(() => {
      status.textContent = "";
    }, 1500);
  }

  saveBtn.addEventListener("click", save);
  load();
})();
