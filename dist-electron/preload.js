import { contextBridge, ipcRenderer } from "electron";
console.log("=== PRELOAD SCRIPT STARTING ===");
console.log("contextBridge available:", typeof contextBridge);
console.log("ipcRenderer available:", typeof ipcRenderer);
try {
  contextBridge.exposeInMainWorld("preloadTest", {
    isWorking: () => "preload is working!"
  });
  console.log("contextBridge test: SUCCESS");
} catch (error) {
  console.error("contextBridge test: FAILED", error);
}
console.log("Setting up ipcRenderer...");
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  }
});
console.log("ipcRenderer setup: SUCCESS");
console.log("Preload script: Setting up igdbApi...");
try {
  contextBridge.exposeInMainWorld("igdbApi", {
    searchGames: (query, limit) => ipcRenderer.invoke("igdb:search-games", query, limit),
    getGameById: (igdbId) => ipcRenderer.invoke("igdb:get-game-by-id", igdbId),
    getPopularGames: (limit) => ipcRenderer.invoke("igdb:get-popular-games", limit),
    testConnection: () => ipcRenderer.invoke("igdb:test-connection"),
    isConfigured: () => ipcRenderer.invoke("igdb:is-configured")
  });
  console.log("Preload script: igdbApi setup SUCCESS");
} catch (error) {
  console.error("Preload script: igdbApi setup FAILED", error);
}
console.log("Preload script: Setting up newsScraper API...");
try {
  contextBridge.exposeInMainWorld("newsScraper", {
    scrapeGameNews: (gameTitle) => {
      console.log("newsScraper.scrapeGameNews called with:", gameTitle);
      return ipcRenderer.invoke("scrape-game-news", gameTitle);
    },
    dispose: () => {
      console.log("newsScraper.dispose called");
      return ipcRenderer.invoke("dispose-news-scraper");
    }
  });
  console.log("Preload script: newsScraper API setup SUCCESS");
} catch (error) {
  console.error("Preload script: newsScraper API setup FAILED", error);
}
console.log("Preload script: Setting up diagnostics...");
try {
  contextBridge.exposeInMainWorld("diagnostics", {
    testIGDBAvailability: () => {
      console.log("=== IGDB Diagnostics ===");
      console.log("window.igdbApi exists:", !!window.igdbApi);
      if (window.igdbApi) {
        console.log("igdbApi methods:", Object.keys(window.igdbApi));
        return true;
      }
      return false;
    },
    testIGDBConnection: async () => {
      if (window.igdbApi) {
        try {
          const result = await window.igdbApi.isConfigured();
          console.log("IGDB isConfigured result:", result);
          return result;
        } catch (error) {
          console.error("IGDB test error:", error);
          return false;
        }
      }
      return false;
    }
  });
  console.log("Preload script: diagnostics setup SUCCESS");
} catch (error) {
  console.error("Preload script: diagnostics setup FAILED", error);
}
window.addEventListener("DOMContentLoaded", () => {
  console.log("=== PRELOAD SCRIPT DOM READY ===");
  console.log("Preload script: Testing API availability:");
  console.log("  - preloadTest:", typeof window.preloadTest);
  console.log("  - newsScraper:", typeof window.newsScraper);
  console.log("  - igdbApi:", typeof window.igdbApi);
  console.log("  - ipcRenderer:", typeof window.ipcRenderer);
  console.log("  - diagnostics:", typeof window.diagnostics);
  if (window.preloadTest) {
    console.log("  - preloadTest result:", window.preloadTest.isWorking());
  }
  if (window.igdbApi) {
    console.log("  - igdbApi methods:", Object.keys(window.igdbApi));
    setTimeout(async () => {
      try {
        const isConfigured = await window.igdbApi.isConfigured();
        console.log("IGDB auto-test result:", isConfigured);
      } catch (error) {
        console.error("IGDB auto-test failed:", error);
      }
    }, 1e3);
  } else {
    console.error("ERROR: igdbApi not found in window object!");
    console.log("Available window properties:", Object.keys(window).filter(
      (k) => k.toLowerCase().includes("igdb") || k.toLowerCase().includes("api") || k.toLowerCase().includes("preload") || k.toLowerCase().includes("diagnostic")
    ));
  }
  console.log("=== END PRELOAD SCRIPT DOM READY ===");
});
function domReady(condition = ["complete", "interactive"]) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener("readystatechange", () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}
const safeDOM = {
  append(parent, child) {
    if (!Array.from(parent.children).find((c) => c === child)) {
      return parent.appendChild(child);
    }
  },
  remove(parent, child) {
    if (Array.from(parent.children).find((c) => c === child)) {
      return parent.removeChild(child);
    }
  }
};
function useLoading() {
  const className = `loaders-css__square-spin`;
  const styleContent = `
@keyframes square-spin {
  25% { 
    transform: perspective(100px) rotateX(180deg) rotateY(0); 
  }
  50% { 
    transform: perspective(100px) rotateX(180deg) rotateY(180deg); 
  }
  75% { 
    transform: perspective(100px) rotateX(0) rotateY(180deg); 
  }
  100% { 
    transform: perspective(100px) rotateX(0) rotateY(0); 
  }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `;
  const oStyle = document.createElement("style");
  const oDiv = document.createElement("div");
  oStyle.id = "app-loading-style";
  oStyle.innerHTML = styleContent;
  oDiv.className = "app-loading-wrap";
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`;
  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle);
      safeDOM.remove(document.body, oDiv);
    }
  };
}
const { appendLoading, removeLoading } = useLoading();
domReady().then(appendLoading);
window.onmessage = (ev) => {
  ev.data.payload === "removeLoading" && removeLoading();
};
setTimeout(removeLoading, 4999);
console.log("=== PRELOAD SCRIPT COMPLETED ===");
console.log("APIs that should be available:");
console.log("- preloadTest:", typeof window.preloadTest);
console.log("- ipcRenderer:", typeof window.ipcRenderer);
console.log("- igdbApi:", typeof window.igdbApi);
console.log("- newsScraper:", typeof window.newsScraper);
console.log("- diagnostics:", typeof window.diagnostics);
console.log("=== END PRELOAD SCRIPT COMPLETED ===");
