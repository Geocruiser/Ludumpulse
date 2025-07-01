"use strict";
const { contextBridge, ipcRenderer } = require("electron");
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
console.log("Preload script: Setting up newsScraper API...");
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
console.log("Preload script: newsScraper API setup complete");
window.addEventListener("DOMContentLoaded", () => {
  console.log("Preload script: Testing newsScraper availability:", typeof window.newsScraper);
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
  oDiv.innerHTML = '<div class="' + className + '"><div></div></div>';
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
nerHTML = '<div class="' + className + '"><div></div></div>';
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
  }
});
export default require_preload();
