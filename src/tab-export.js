/* 页签清单: local-only Markdown serialization. Original Omni remains MIT licensed. */
(function (root) {
  "use strict";

  function escapeLabel(value) {
    return String(value).replace(/\s+/g, " ").trim()
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/[\\`*_{}\[\]()#!|]/g, "\\$&");
  }

  function prepareTabs(tabs, { deduplicate = true } = {}) {
    const seen = new Set();
    const links = [];
    let skipped = 0;
    let duplicates = 0;
    for (const tab of [...tabs].sort((a, b) => (a.index ?? 0) - (b.index ?? 0))) {
      let url;
      try {
        url = new URL(tab.url);
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
          skipped++;
          continue;
        }
      } catch {
        skipped++;
        continue;
      }
      const href = url.href.replace(/</g, "%3C").replace(/>/g, "%3E");
      if (deduplicate && seen.has(href)) {
        duplicates++;
        continue;
      }
      seen.add(href);
      links.push({ title: String(tab.title || "").trim() || url.hostname, url: href });
    }
    return { links, skipped, duplicates };
  }

  function toMarkdown(links) {
    return "# 标签页清单\n\n" + links.map(link =>
      `- [${escapeLabel(link.title)}](<${link.url}>)`).join("\n") + "\n";
  }

  const api = Object.freeze({ prepareTabs, toMarkdown });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.OmniTabExport = api;
})(globalThis);
