// Thin WebSocket wrapper that buffers outgoing messages until the socket
// is open and exposes a simple event-emitter API.

export class Net extends EventTarget {
  constructor() {
    super();
    this.ws = null;
    this.youId = null;
    this.connected = false;
    this._queue = [];
  }

  connect(url, name) {
    return new Promise((resolve, reject) => {
      const full = `${url}?name=${encodeURIComponent(name)}`;
      let ws;
      try {
        ws = new WebSocket(full);
      } catch (err) {
        reject(err);
        return;
      }
      this.ws = ws;
      ws.onopen = () => {
        this.connected = true;
        for (const m of this._queue) ws.send(m);
        this._queue.length = 0;
        resolve();
      };
      ws.onerror = () => {
        if (!this.connected) reject(new Error("WebSocket error"));
        this.dispatchEvent(new CustomEvent("error"));
      };
      ws.onclose = () => {
        this.connected = false;
        this.dispatchEvent(new CustomEvent("close"));
      };
      ws.onmessage = (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        if (msg.type === "welcome") this.youId = msg.you;
        this.dispatchEvent(new CustomEvent("message", { detail: msg }));
      };
    });
  }

  send(obj) {
    const data = JSON.stringify(obj);
    if (this.ws && this.connected) this.ws.send(data);
    else this._queue.push(data);
  }
}
