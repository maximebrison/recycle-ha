class p {
  build(t) {
    this._setConfig(t);
    const e = document.createElement("div"), n = document.createElement("div"), s = document.createElement("img"), o = document.createElement("div"), i = document.createElement("img");
    return this.result = document.createElement("div"), e.className = "homepage", n.className = "button settingsButton", o.className = "button updateButton", this.result.className = "result", s.src = "/local/assets/svg/gear-solid.svg", i.src = "/local/assets/svg/arrows-rotate-solid.svg", this.result.innerHTML = "Loading...", o.addEventListener("click", () => {
      this._emptyCache(), this._cacheCollection();
    }), n.addEventListener("click", () => {
      this._emptyCache(), this._clearConfig();
    }), n.appendChild(s), o.appendChild(i), e.appendChild(n), e.appendChild(this.result), e.appendChild(o), this._cacheCollection(), e;
  }
  _setConfig(t) {
    this.hass = t, this.config = {
      set: JSON.parse(this.hass.states["input_text.recycle"].state).set,
      lastUpdate: JSON.parse(this.hass.states["input_text.recycle"].state).lastUpdate
    };
  }
  _clearConfig() {
    this.hass.callService("input_text", "set_value", {
      entity_id: "input_text.recycle",
      value: "unknown"
    });
  }
  _setInterface() {
    this.result.innerHTML = "";
    const e = new Date(this.collections[0].date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long"
    }), n = document.createElement("div"), s = document.createElement("div"), o = document.createElement("div"), i = document.createElement("div");
    i.className = "collections", n.className = "infoHeader", s.className = "collectLabel", o.className = "dateLabel", s.innerHTML = "Prochaine collecte", o.innerHTML = `${e}`;
    for (let r of this.collections)
      i.appendChild(this._collection(r));
    n.appendChild(s), n.appendChild(o), this.result.appendChild(n), this.result.appendChild(i);
  }
  _collection(t) {
    const e = document.createElement("div"), n = document.createElement("p"), s = document.createElement("img");
    return e.className = "collectionItem", e.style.backgroundColor = t.color, n.innerHTML = t.name, s.src = t.logo, e.appendChild(s), e.appendChild(n), e;
  }
  _checkLocalStorage() {
    const t = localStorage.getItem("recycle_collections");
    if (t)
      try {
        return JSON.parse(t);
      } catch {
        return console.warn("Invalid JSON cached"), localStorage.removeItem("recycle_collections"), !1;
      }
    else
      return !1;
  }
  _emptyCache() {
    localStorage.removeItem("recycle_collections");
  }
  async _cacheCollection() {
    let t = this._checkLocalStorage();
    if (!t || this._lastUpdateCheck(this.config.lastUpdate)) {
      const e = await this._qCollections();
      localStorage.setItem("recycle_collections", JSON.stringify(e)), this.hass.callService("input_text", "set_value", {
        entity_id: "input_text.recycle",
        value: JSON.stringify({
          set: this.config.set,
          lastUpdate: Date.now()
        })
      }), this.collections = e, console.log(`Result was not cached : ${JSON.stringify(e)}`);
    } else
      this.collections = t, console.log(`Result was cached : ${t}`);
    this._setInterface();
  }
  _lastUpdateCheck(t) {
    return Date.now() - t >= 864e5;
  }
  async _qCollections() {
    const e = await (await fetch("http://mbnrandomtools.dev.lan/recycle/garbage_collection", {
      method: "GET"
    })).json();
    return console.log(e), e;
  }
}
class h {
  constructor() {
    this.zipcodeId = "", this.streetId = "", this.houseNumber = 0, this.debouncedQuery = this._debounce(this._buildDropdown.bind(this), 400);
  }
  build(t) {
    this.hass = t;
    const e = document.createElement("div"), n = document.createElement("div"), s = document.createElement("input"), o = document.createElement("div"), i = document.createElement("input"), r = document.createElement("div"), c = document.createElement("input"), a = document.createElement("button");
    return n.className = "input-wrapper", o.className = "input-wrapper", r.className = "input-wrapper", e.className = "settings", s.id = "zipcode", i.id = "street", c.id = "houseNumber", s.placeholder = "Zip code", i.placeholder = "Street name", c.placeholder = "House number", a.innerHTML = "submit", s.addEventListener("input", () => {
      if (parseInt(s.value) === NaN || s.value.search(/\D/gm) !== -1 || s.value.length === 0)
        console.log("Bad input");
      else {
        const l = parseInt(s.value);
        this.debouncedQuery("zipcode", n, s, l);
      }
    }), i.addEventListener("input", () => {
      i.value.length === 0 ? console.log("[Recycle!] Bad input") : this.debouncedQuery("street", o, i, i.value);
    }), c.addEventListener("input", () => {
      parseInt(c.value) !== NaN && (this.houseNumber = parseInt(c.value));
    }), a.addEventListener("click", () => {
      this._save();
    }), n.appendChild(s), o.appendChild(i), r.appendChild(c), e.appendChild(n), e.appendChild(o), e.appendChild(r), e.appendChild(a), e;
  }
  async _buildDropdown(t, e, n, s) {
    e.querySelector(".dropdown") && e.removeChild(e.querySelector(".dropdown"));
    const o = document.createElement("div");
    switch (o.className = "dropdown", t) {
      case "zipcode":
        let i = await this._qZipcodes(s);
        for (let c of i) {
          const a = Object.keys(c)[0], l = document.createElement("div");
          l.className = "entry", l.innerHTML = a, l.addEventListener("click", () => {
            this.zipcodeId = c[a], console.log(this.zipcodeId), e.removeChild(o), n.value = a;
          }), o.appendChild(l);
        }
        break;
      case "street":
        let r = await this._qStreets(s);
        for (let c of r) {
          const a = Object.keys(c)[0], l = document.createElement("div");
          l.className = "entry", l.innerHTML = a, l.addEventListener("click", () => {
            this.streetId = c[a], console.log(this.streetId), e.removeChild(o), n.value = a;
          }), o.appendChild(l);
        }
        break;
    }
    e.appendChild(o), document.addEventListener("keydown", (i) => {
      i.key === "Escape" && e.removeChild(o);
    });
  }
  async _qZipcodes(t) {
    return await (await fetch("http://mbnrandomtools.dev.lan/recycle/zipcode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code: t
      })
    })).json();
  }
  async _qStreets(t) {
    const e = {
      streetName: t,
      zipcodeId: this.zipcodeId
    };
    return await (await fetch("http://mbnrandomtools.dev.lan/recycle/street", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(e)
    })).json();
  }
  async _save() {
    if (this.zipcodeId && this.streetId && this.houseNumber) {
      const t = {
        zipcodeId: this.zipcodeId,
        streetId: this.streetId,
        houseNumber: this.houseNumber
      }, n = (await fetch("http://mbnrandomtools.dev.lan/recycle/set_config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(t)
      })).json();
      n ? (this.hass.callService("input_text", "set_value", {
        entity_id: "input_text.recycle",
        value: JSON.stringify({
          set: !0,
          lastUpdate: Date.now()
        })
      }), console.log(`State saved ! ${n}`)) : console.warn("Error while saving settings");
    } else
      console.log("Missing fields");
  }
  _debounce(t, e = 300) {
    let n;
    return (...s) => {
      clearTimeout(n), n = setTimeout(() => t(...s), e);
    };
  }
}
const u = '@font-face{font-family:Lato;src:url(/local/assets/fonts/lato.heavy.woff2) format("woff2")}*{box-sizing:border-box}.settings{display:flex;flex-direction:column;width:100%;height:100%;gap:15px}.dropdown{position:absolute;display:flex;flex-direction:column;gap:5px;z-index:999;left:0;top:100%;right:0;width:100%;max-height:200px;padding:15px;background-color:#202022;overflow-y:auto}.entry{display:flex;justify-content:center;align-items:center;width:100%;min-height:50px;border-radius:5px;color:#fff0eb;background-color:#323135;-webkit-user-select:none;user-select:none;cursor:pointer}.entry:hover{background-color:#46454a}.entry:active{background-color:#46454a80}.input-wrapper{position:relative;width:100%}.input-wrapper input{padding:5px;width:100%}.homepage{display:flex;flex-direction:column;justify-content:center;align-items:center;position:relative;min-width:100px;min-height:100px}.button{position:absolute;display:none;top:0;right:0;width:38px;height:38px;border-radius:5px;padding:5px;background-color:#323135;transition:scale .2s ease}.button:hover{opacity:80%}.button:active{scale:.9}.settingsButton{right:0}.updateButton{left:0}.button img{width:100%;height:100%}.homepage:hover{opacity:50%}.homepage:hover .button{display:block}.result{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:15px;width:100%;height:100%}.infoHeader{display:flex;flex-direction:column;align-items:center;justify-content:center}.infoHeader .collectLabel{font-size:1.2em}.infoHeader .dateLabel{font-size:1.5em;font-weight:700}.collections{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:15px;width:100%}.collectionItem{display:inline-flex;align-items:center;justify-content:center;width:fit-content;height:32px;color:#fff0eb;border-radius:9999px;padding:0 5px;gap:5px;font-size:11px}.collectionItem img{height:22px;border-radius:50%;box-shadow:0 4px 8px #0003,0 6px 20px #00000030}.collectionItem p{font-family:Lato,sans-serif;text-align:center;font-size:1em;line-height:1.2em;letter-spacing:.08em;font-weight:700;text-transform:uppercase;width:100%;height:fit-content;padding:0 5px;text-shadow:1px 1px 4px black}';
class m extends HTMLElement {
  constructor() {
    super(), this.attachShadow({ mode: "open" });
  }
  set hass(t) {
    this._hass = t, this.settings = new h(), this.homepage = new p(), this.content || (this.shadowRoot.innerHTML = `
        <style>${u}</style>
        <ha-card>
          <div class="card-content"></div>
        </ha-card>
      `, this.content = this.shadowRoot.querySelector(".card-content")), this.content.innerHTML = "";
    const e = this._hass.states["input_text.recycle"];
    !e || e.state === "unknown" || e.state === "" ? this.content.appendChild(this.settings.build(this._hass)) : this.content.appendChild(this.homepage.build(this._hass));
  }
  setConfig(t) {
    this.config = t;
  }
  getCardSize() {
    return 3;
  }
  getGridOptions() {
    return {
      rows: 3,
      columns: 9,
      min_rows: 3,
      max_rows: 3
    };
  }
}
customElements.define("recycle-card", m);
