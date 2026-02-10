export class Settings {
    constructor(){
        this.zipcodeId = "";
        this.streetId = "";
        this.houseNumber = 0;
        this.debouncedQuery = this._debounce(this._buildDropdown.bind(this), 400);
    }

    build(hass){
        this.hass = hass;
        const container = document.createElement("div");
        const zipcodeInputWrapper = document.createElement("div");
        const zipcodeInput = document.createElement("input");
        const streetInputWrapper = document.createElement("div");
        const streetInput = document.createElement("input");
        const houseNumberInputWrapper = document.createElement("div");
        const houseNumberInput = document.createElement("input");
        const submit = document.createElement("button");

        zipcodeInputWrapper.className = "input-wrapper";
        streetInputWrapper.className = "input-wrapper";
        houseNumberInputWrapper.className = "input-wrapper";
        container.className = "settings";

        zipcodeInput.id = "zipcode";
        streetInput.id = "street";
        houseNumberInput.id = "houseNumber";

        zipcodeInput.placeholder = "Zip code";
        streetInput.placeholder = "Street name";
        houseNumberInput.placeholder = "House number";
        submit.innerHTML = "submit";

        zipcodeInput.addEventListener("input", () => {
            if(parseInt(zipcodeInput.value) === NaN || zipcodeInput.value.search(/\D/gm) !== -1 || zipcodeInput.value.length === 0){
                console.log("Bad input");
            } else {
                const zipcode = parseInt(zipcodeInput.value);
                this.debouncedQuery("zipcode", zipcodeInputWrapper, zipcodeInput, zipcode);
            }
        });

        streetInput.addEventListener("input", () => {
            if(streetInput.value.length === 0){
                console.log("[Recycle!] Bad input");
            } else{
                this.debouncedQuery("street", streetInputWrapper, streetInput, streetInput.value);
            }
        })

        houseNumberInput.addEventListener("input", () => {
            if(parseInt(houseNumberInput.value) !== NaN){
                this.houseNumber = parseInt(houseNumberInput.value);
            }
        })

        submit.addEventListener("click", () => {
            this._save();
        })

        zipcodeInputWrapper.appendChild(zipcodeInput);
        streetInputWrapper.appendChild(streetInput);
        houseNumberInputWrapper.appendChild(houseNumberInput);
        container.appendChild(zipcodeInputWrapper);
        container.appendChild(streetInputWrapper);
        container.appendChild(houseNumberInputWrapper);
        container.appendChild(submit);
        return container;
    }

    async _buildDropdown(type, wrapper, input, value){
        (wrapper.querySelector(".dropdown") ? wrapper.removeChild(wrapper.querySelector(".dropdown")): null);
        const dropdown = document.createElement("div");
        dropdown.className = "dropdown";
        switch(type){
            case "zipcode":
                let zipcodes = await this._qZipcodes(value);
                for(let i of zipcodes){
                    const key = Object.keys(i)[0]
                    const entry = document.createElement("div");
                    entry.className = "entry";
                    entry.innerHTML = key;
                    entry.addEventListener("click", () => {
                        this.zipcodeId = i[key];
                        console.log(this.zipcodeId);
                        wrapper.removeChild(dropdown);
                        input.value = key;
                    })
                    dropdown.appendChild(entry);
                }
                break;
            case "street":
                let streets = await this._qStreets(value);
                for(let i of streets){
                    const key = Object.keys(i)[0]
                    const entry = document.createElement("div");
                    entry.className = "entry";
                    entry.innerHTML = key;
                    entry.addEventListener("click", () => {
                        this.streetId = i[key];
                        console.log(this.streetId);
                        wrapper.removeChild(dropdown);
                        input.value = key;
                    })
                    dropdown.appendChild(entry);
                }
                break;
        }
        wrapper.appendChild(dropdown);
        document.addEventListener("keydown", (e) => {
            if(e.key === "Escape"){
                wrapper.removeChild(dropdown);
            }
        });
    }

    async _qZipcodes(zipcode){
        const payload = {
            code: zipcode
        }
        const res = await fetch(`http://mbnrandomtools.dev.lan/recycle/zipcode`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        return data;
    }

    async _qStreets(street){
        const payload = {
            streetName: street,
            zipcodeId: this.zipcodeId
        }
        const res = await fetch(`http://mbnrandomtools.dev.lan/recycle/street`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        return data;
    }

    async _save(){
        if(this.zipcodeId && this.streetId && this.houseNumber){
            const payload = {
                zipcodeId: this.zipcodeId,
                streetId: this.streetId,
                houseNumber: this.houseNumber
            };

            const res = await fetch(`http://mbnrandomtools.dev.lan/recycle/set_config`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = res.json();

            if(data){
                this.hass.callService("input_text", "set_value", {
                    entity_id: "input_text.recycle",
                    value: JSON.stringify({
                        set: true,
                        lastUpdate: Date.now()
                    })
                });
                console.log(`State saved ! ${data}`);
            } else{
                console.warn("Error while saving settings")
            }
        } else {
            console.log("Missing fields");
        }
    }

    _debounce(fn, delay = 300){
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay)
        }
    }
}