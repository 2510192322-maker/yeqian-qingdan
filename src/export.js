"use strict";

const preview = document.getElementById("preview");
const summary = document.getElementById("summary");
const feedback = document.getElementById("feedback");
const copyButton = document.getElementById("copy");
const downloadButton = document.getElementById("download");
const refreshButton = document.getElementById("refresh");
const deduplicate = document.getElementById("deduplicate");
let snapshot = [];

function render() {
  const result = OmniTabExport.prepareTabs(snapshot, { deduplicate: deduplicate.checked });
  preview.value = result.links.length ? OmniTabExport.toMarkdown(result.links) : "";
  summary.textContent = `${result.links.length} 个链接 · 去除 ${result.duplicates} 个重复 · 跳过 ${result.skipped} 个不支持的页面`;
  copyButton.disabled = downloadButton.disabled = result.links.length === 0;
  feedback.textContent = result.links.length ? "" : "当前窗口没有可导出的网页，请打开网页后刷新。";
}

async function refresh() {
  refreshButton.disabled = true;
  copyButton.disabled = downloadButton.disabled = true;
  try {
    const current = await chrome.tabs.getCurrent();
    if (!Number.isInteger(current?.windowId)) throw new Error("No current window");
    const tabs = await chrome.tabs.query({ windowId: current.windowId });
    snapshot = tabs.filter(tab => tab.id !== current.id);
    render();
  } catch {
    snapshot = [];
    preview.value = "";
    summary.textContent = "读取标签页失败";
    feedback.textContent = "请确认插件已启用，再点击刷新重试。";
  } finally {
    refreshButton.disabled = false;
  }
}

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(preview.value);
    feedback.textContent = "Markdown 已复制。";
  } catch {
    preview.focus();
    preview.select();
    feedback.textContent = "自动复制未获允许，已选中内容，请按 ⌘C / Ctrl+C 复制。";
  }
});

downloadButton.addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([preview.value], { type: "text/markdown;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `yeqian-qingdan-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  feedback.textContent = "已发起 Markdown 下载，请查看浏览器下载列表。";
});

refreshButton.addEventListener("click", refresh);
deduplicate.addEventListener("change", render);
refresh();
