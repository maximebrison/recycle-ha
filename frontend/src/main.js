import { Homepage } from "./homepage";
import { Settings } from "./settings";
import styles from "./style.css?inline";

class Recycle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  set hass(hass) {
    this._hass = hass;
    this.settings = new Settings();
    this.homepage = new Homepage();

    if (!this.content) {
      this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <ha-card>
          <div class="card-content"></div>
        </ha-card>
      `;
      this.content = this.shadowRoot.querySelector(".card-content");
    }

    this.content.innerHTML = "";

    const entity = this._hass.states["input_text.recycle"];
    if(!entity || entity.state === "unknown" || entity.state === ""){
      this.content.appendChild(this.settings.build(this._hass));
    } else{
      this.content.appendChild(this.homepage.build(this._hass))
    }
  }

  setConfig(config) {
    this.config = config;
  }

  getCardSize() {
    return 3;
  }

  getGridOptions() {
    return {
      rows: 3,
      columns: 9,
      min_rows: 3,
      max_rows: 3,
    };
  }
}

customElements.define("recycle-card", Recycle);