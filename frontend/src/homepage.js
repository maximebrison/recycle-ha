export class Homepage {
    build(hass){
        this._setConfig(hass);
        const container = document.createElement("div");
        const settingsButton = document.createElement("div");
        const settingsLogo = document.createElement("img");
        const updateButton = document.createElement("div");
        const updateLogo = document.createElement("img");
        this.result = document.createElement("div");

        container.className = "homepage";
        settingsButton.className = "button settingsButton";
        updateButton.className = "button updateButton";
        this.result.className = "result";

        settingsLogo.src = "/local/assets/svg/gear-solid.svg";
        updateLogo.src = "/local/assets/svg/arrows-rotate-solid.svg";
        this.result.innerHTML = "Loading...";

        updateButton.addEventListener("click", () => {
            this._emptyCache();
            this._cacheCollection();
        });

        settingsButton.addEventListener("click", () => {
            this._emptyCache();
            this._clearConfig();
        })

        settingsButton.appendChild(settingsLogo);
        updateButton.appendChild(updateLogo);
        container.appendChild(settingsButton);
        container.appendChild(this.result);
        container.appendChild(updateButton);
        this._cacheCollection();
        return container;
    }

    _setConfig(hass){
        this.hass = hass;
        this.config = {
            set: JSON.parse(this.hass.states["input_text.recycle"].state).set,
            lastUpdate: JSON.parse(this.hass.states["input_text.recycle"].state).lastUpdate
        };
    }

    _clearConfig(){
        this.hass.callService("input_text", "set_value", {
            entity_id: "input_text.recycle",
            value: "unknown"
        });
    }

    _setInterface(){
        this.result.innerHTML = "";

        const nextCollect = new Date(this.collections[0].date);
        const formatted = nextCollect.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long"
        });

        const infoHeader = document.createElement("div");
        const collectLabel = document.createElement("div");
        const dateLabel = document.createElement("div");
        const collections = document.createElement("div");

        collections.className = "collections";
        infoHeader.className = "infoHeader";
        collectLabel.className = "collectLabel";
        dateLabel.className = "dateLabel";

        collectLabel.innerHTML = `Prochaine collecte`;
        dateLabel.innerHTML = `${formatted}`;

        for(let i of this.collections){
            collections.appendChild(this._collection(i));
        }

        infoHeader.appendChild(collectLabel);
        infoHeader.appendChild(dateLabel);
        this.result.appendChild(infoHeader);
        this.result.appendChild(collections);
    }

    _collection(data){
        const container = document.createElement("div");
        const label = document.createElement("p");
        const logo = document.createElement("img");

        container.className = "collectionItem";
        container.style.backgroundColor = data.color;

        label.innerHTML = data.name;
        logo.src = data.logo;

        container.appendChild(logo);
        container.appendChild(label);
        return container;
    }

    _checkLocalStorage(){
        const lastCollection = localStorage.getItem("recycle_collections");

        if(lastCollection){
            try{
                let cached = JSON.parse(lastCollection);
                return cached;
            } catch(e){
                console.warn("Invalid JSON cached");
                localStorage.removeItem("recycle_collections");
                return false;
            }
        } else{
            return false;
        }
    }

    _emptyCache(){
        localStorage.removeItem("recycle_collections");
    }

    async _cacheCollection(){
        let cache = this._checkLocalStorage();

        if(!cache || this._lastUpdateCheck(this.config.lastUpdate)){
            const data = await this._qCollections();
            localStorage.setItem("recycle_collections", JSON.stringify(data));
            this.hass.callService("input_text", "set_value", {
                entity_id: "input_text.recycle",
                value: JSON.stringify({
                    set: this.config.set,
                    lastUpdate: Date.now()
                })
            });
            this.collections = data;
            console.log(`Result was not cached : ${JSON.stringify(data)}`);
        } else{
            this.collections = cache;
            console.log(`Result was cached : ${cache}`);
        }

        this._setInterface();
    }

    _lastUpdateCheck(lastDate){
        const today = Date.now();
        return (today - lastDate >= 86400000 ? true: false);
    }

    async _qCollections(){
        const res = await fetch(`http://mbnrandomtools.dev.lan/recycle/garbage_collection`, {
            method: "GET"
        });

        const data = await res.json();
        console.log(data);
        return data;
    }
}