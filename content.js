(() => {
  const ext = typeof browser !== "undefined" ? browser : chrome;

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

  function normalizeUrl(href) {
    if (!href) return null;
    try {
      const url = new URL(href, window.location.origin);
      url.hash = "";
      return url.href;
    } catch (err) {
      return null;
    }
  }

  function seriesKey(seriesUrl) {
    return `anime::${seriesUrl}`;
  }

  function parseTotalEpisodes(text) {
    if (!text) return null;
    const match = text.match(/\s(\d+)\s*\/\s*(\d+)/);
    if (!match) return null;
    const total = parseInt(match[2], 10);
    return Number.isFinite(total) ? total : null;
  }

  function getSeriesInfo() {
    const link = document.querySelector(".det h2 a");
    let title = null;
    let seriesUrl = null;

    if (link) {
      title = link.textContent ? link.textContent.trim() : null;
      seriesUrl = normalizeUrl(link.getAttribute("href"));
    }

    if (!title) {
      title = document.title ? document.title.trim() : null;
    }

    if (!seriesUrl) {
      seriesUrl = normalizeUrl(window.location.href);
    }

    let totalEpisodes = null;
    const detSpan = document.querySelector(".det span");
    if (detSpan) {
      totalEpisodes = parseTotalEpisodes(detSpan.textContent || "");
    }

    return { title, seriesUrl, totalEpisodes };
  }

  async function loadSeriesRecord(seriesInfo) {
    if (!seriesInfo.seriesUrl) return null;
    const key = seriesKey(seriesInfo.seriesUrl);
    const data = await storageGet(key);
    const existing = data[key];

    const record = existing || {
      title: seriesInfo.title || "",
      seriesUrl: seriesInfo.seriesUrl,
      isFavorite: false,
      completedEpisodes: [],
      totalEpisodes: null,
      lastUpdated: Date.now()
    };

    if (seriesInfo.title && seriesInfo.title !== record.title) {
      record.title = seriesInfo.title;
    }

    if (seriesInfo.totalEpisodes) {
      record.totalEpisodes = seriesInfo.totalEpisodes;
    }

    return record;
  }

  async function saveSeriesRecord(record) {
    if (!record || !record.seriesUrl) return;
    record.lastUpdated = Date.now();
    const key = seriesKey(record.seriesUrl);
    await storageSet({ [key]: record });
  }

  function createFavoriteButton(record) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ae-btn";
    btn.setAttribute("aria-pressed", record.isFavorite ? "true" : "false");
    btn.textContent = record.isFavorite ? "Favorited" : "Favorite";

    btn.addEventListener("click", async () => {
      record.isFavorite = !record.isFavorite;
      btn.setAttribute("aria-pressed", record.isFavorite ? "true" : "false");
      btn.textContent = record.isFavorite ? "Favorited" : "Favorite";
      await saveSeriesRecord(record);
    });

    return btn;
  }

  function injectFavoriteButton(record) {
    if (!record || !record.seriesUrl) return;

    const existing = document.querySelector(".ae-favorite");
    if (existing) return;

    const container = document.createElement("span");
    container.className = "ae-inline ae-favorite";
    container.appendChild(createFavoriteButton(record));

    const titleLink = document.querySelector(".det h2 a");
    if (titleLink && titleLink.parentElement) {
      titleLink.parentElement.appendChild(container);
      return;
    }

    const episodeList = document.querySelector(".episodelist");
    if (episodeList) {
      episodeList.parentElement.insertBefore(container, episodeList);
    }
  }

  function getEpisodeItems() {
    return Array.from(document.querySelectorAll(".episodelist ul li"));
  }

  function episodeUrlFromItem(item) {
    const link = item.querySelector("a[href]");
    return link ? normalizeUrl(link.getAttribute("href")) : null;
  }

  function episodeNumberFromItem(item) {
    const span = item.querySelector(".playinfo span");
    if (!span) return null;
    const match = span.textContent.match(/Eps\s+(\d+)/i);
    if (!match) return null;
    const num = parseInt(match[1], 10);
    return Number.isFinite(num) ? num : null;
  }

  function injectProgress(record, items) {
    if (!record) return;
    const list = document.querySelector(".episodelist");
    if (!list) return;

    let progress = document.querySelector(".ae-progress");
    if (!progress) {
      progress = document.createElement("div");
      progress.className = "ae-progress headlist";
      list.parentElement.insertBefore(progress, list);
    }

    const completed = record.completedEpisodes.length;
    const total = record.totalEpisodes || items.length || 0;
    if (total > 0) {
      progress.textContent = `Progress: ${completed}/${total}`;
    } else {
      progress.textContent = `Progress: ${completed}`;
    }
  }

  function injectRangeControls(record, items) {
    const list = document.querySelector(".episodelist");
    if (!list) return;

    let range = document.querySelector(".ae-range");
    if (!range) {
      range = document.createElement("div");
      range.className = "ae-range headlist";

      const label = document.createElement("span");
      // label.className = "ae-muted";
      label.textContent = "Mark range:";

      const startInput = document.createElement("input");
      startInput.type = "text";
      startInput.placeholder = "Start";
      startInput.className = "ae-range-start";

      const endInput = document.createElement("input");
      endInput.type = "text";
      endInput.placeholder = "End";
      endInput.className = "ae-range-end";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "ae-btn";
      button.textContent = "Mark Range";

      const status = document.createElement("span");
      status.className = "ae-muted ae-range-status";

      button.addEventListener("click", async () => {
        const startVal = parseInt(startInput.value, 10);
        const endVal = parseInt(endInput.value, 10);
        if (!Number.isFinite(startVal) || !Number.isFinite(endVal)) {
          status.textContent = "Enter start and end.";
          return;
        }

        const start = Math.min(startVal, endVal);
        const end = Math.max(startVal, endVal);

        const urlsToMark = [];
        items.forEach((item) => {
          const epNum = episodeNumberFromItem(item);
          if (!epNum || epNum < start || epNum > end) return;
          const url = episodeUrlFromItem(item);
          if (url) urlsToMark.push({ url, item });
        });

        if (!urlsToMark.length) {
          status.textContent = "No episodes matched.";
          return;
        }

        const set = new Set(record.completedEpisodes);
        urlsToMark.forEach(({ url, item }) => {
          set.add(url);
          const checkbox = item.querySelector("input.ae-checkbox");
          if (checkbox) checkbox.checked = true;
        });

        record.completedEpisodes = Array.from(set);
        await saveSeriesRecord(record);
        injectProgress(record, items);
        status.textContent = `Marked ${urlsToMark.length} episode(s).`;
      });

      range.appendChild(label);
      range.appendChild(startInput);
      range.appendChild(endInput);
      range.appendChild(button);
      range.appendChild(status);

      list.parentElement.insertBefore(range, list);
    }
  }

  function injectEpisodeControls(record) {
    const items = getEpisodeItems();
    if (!items.length) return;

    items.forEach((item) => {
      if (item.dataset.aeBound === "1") return;
      item.dataset.aeBound = "1";

      const episodeUrl = episodeUrlFromItem(item);
      if (!episodeUrl) return;

      const control = document.createElement("label");
      control.className = "ae-episode-control";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "ae-checkbox";
      checkbox.checked = record.completedEpisodes.includes(episodeUrl);

      const text = document.createElement("span");
      text.className = "ae-muted";
      text.textContent = "Completed";

      checkbox.addEventListener("change", async () => {
        const idx = record.completedEpisodes.indexOf(episodeUrl);
        if (checkbox.checked && idx === -1) {
          record.completedEpisodes.push(episodeUrl);
        } else if (!checkbox.checked && idx !== -1) {
          record.completedEpisodes.splice(idx, 1);
        }
        await saveSeriesRecord(record);
        injectProgress(record, items);
      });

      control.appendChild(checkbox);
      control.appendChild(text);

      const playInfo = item.querySelector(".playinfo");
      if (playInfo) {
        playInfo.appendChild(control);
      } else {
        item.appendChild(control);
      }
    });

    injectProgress(record, items);
    injectRangeControls(record, items);
  }

  async function init() {
    const seriesInfo = getSeriesInfo();
    if (!seriesInfo.seriesUrl) return;

    const record = await loadSeriesRecord(seriesInfo);
    if (!record) return;

    injectFavoriteButton(record);
    injectEpisodeControls(record);
    await saveSeriesRecord(record);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
