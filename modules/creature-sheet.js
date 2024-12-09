export class witchcraftCreatureSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["witchcraft", "sheet", "actor", `${game.settings.get("witchcraft", "dark-mode") ? "dark-mode" : ""}`],
            width: 700,
            height: 820,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "core" }],
            dragDrop: [{
                dragSelector: [
                    ".item"
                ],
                dropSelector: null
            }]
        });
    }

    /* -------------------------------------------- */
    /** @override */

    getData() {
        const data = super.getData();
        data.isGM = game.user.isGM;
        data.editable = data.options.editable;
        const actorData = data.system;
        let options = 0;
        let user = this.user;

        this._prepareCharacterItems(data)

        return data
    }

    _prepareCharacterItems(sheetData) {
        const actorData = sheetData.actor

        // Initialize Containers
        const item = [];
        const equippedItem = [];
        const weapon = [];
        const skill = [];
        const aspect = [];

        // Iterate through items and assign to containers
        for (let i of sheetData.items) {
            switch (i.type) {
                case "item":
                    if (i.system.equipped) { equippedItem.push(i) }
                    else { item.push(i) }
                    break

                case "weapon":
                    weapon.push(i)
                    break

                case "skill":
                    skill.push(i)
                    break

                case "aspect":
                    aspect.push(i)
                    break
            }
        }

        // Alphabetically sort all items
        const itemCats = [item, equippedItem, weapon, skill, aspect]
        for (let category of itemCats) {
            if (category.length > 1) {
                category.sort((a, b) => {
                    let nameA = a.name.toLowerCase()
                    let nameB = b.name.toLowerCase()
                    if (nameA > nameB) { return 1 }
                    else { return -1 }
                })
            }
        }

        // Assign and return items
        actorData.item = item
        actorData.equippedItem = equippedItem
        actorData.weapon = weapon
        actorData.skill = skill
        actorData.aspect = aspect
    }

    get template() {
        const path = "systems/witchcraft/templates";
        if (!game.user.isGM && this.actor.limited) return "systems/witchcraft/templates/limited-creature-sheet.hbs";
        return `${path}/${this.actor.type}-sheet.hbs`;
    }

    /** @override */
    async activateListeners(html) {
        super.activateListeners(html);

        // Run non-event functions
        // this._createCharacterPointDivs()
        this._createStatusTags()

        // Buttons and Event Listeners
        html.find('.attribute-roll').click(this._onAttributeRoll.bind(this))
        if (this.actor.isOwner) html.find('.damage-roll').click(this._onDamageRoll.bind(this))
        html.find('.toggleEquipped').click(this._onToggleEquipped.bind(this))
        html.find('.armor-button-cell button').click(this._onArmorRoll.bind(this))
        html.find('.reset-resource').click(this._onResetResource.bind(this))

        // Update/Open Inventory Item
        html.find('.create-item').click(this._createItem.bind(this))

        html.find('.item-name').click((ev) => {
            const li = ev.currentTarget.closest(".item")
            const item = this.actor.items.get(li.dataset.itemId)
            if (this.actor.permission[game.user._id] >= 2 || game.user.isGM) { item.sheet.render(true) }
            item.update({ "system.value": item.system.value })
        })

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = ev.currentTarget.closest(".item");
            this.actor.deleteEmbeddedDocuments("Item", [li.dataset.itemId]);
        });
    }

    /**
   * Handle clickable rolls.
   * @param event   The originating click event
   * @private
   */

    _createItem(event) {
        event.preventDefault()
        const element = event.currentTarget

        let itemData = {
            name: `New ${element.dataset.create}`,
            type: element.dataset.create,
            cost: 0,
            level: 0
        }
        return Item.create(itemData, { parent: this.actor })
    }

    _onAttributeRoll(event) {
        event.preventDefault()
        let element = event.currentTarget
        let attributeLabel = element.dataset.attributeName

        // Create options for Qualities/Drawbacks/Skills
        let skillOptions = []
        for (let skill of this.actor.items.filter(item => item.type === 'skill')) {
            let option = `<option value="${skill.id}">${skill.name} ${skill.system.level}</option>`
            skillOptions.push(option)
        }

        let aspectOptions = []
        for (let aspect of this.actor.items.filter(item => item.type === 'aspect')) {
            let option = `<option value="${aspect.id}">${aspect.name} ${aspect.system.power}</option>`
            aspectOptions.push(option)
        }

        // Create Classes for Dialog Box
        let mode = game.settings.get("witchcraft", "dark-mode") ? "dark-mode" : ""
        let dialogOptions = { classes: ["dialog", "witchcraft", mode] }

        // Create Dialog Prompt
        let d = new Dialog({
            title: 'Attribute Roll',
            content: `<div class="witchcraft-dialog-menu">
                            <h2>${attributeLabel} Roll</h2>

                            <div class="witchcraft-dialog-menu-text-box">
                                <div>
                                    <p>Apply modifiers from the creature's Skills.</p>
                                    
                                    <ul>
                                        <li>Simple Test: 2x Attribute</li>
                                        <li>Difficult Test: 1x Attribute</li>
                                    </ul>
                                </div>
                            </div>


                            <table>
                                <tbody>
                                    <tr>
                                        <td class="table-bold-text">Attribute Test</td>
                                        <td class="table-center-align">
                                            <select id="attributeTestSelect" name="attributeTest">
                                                <option value="Simple">Simple</option>
                                                <option value="Difficult">Difficult</option>
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">Roll Modifier</td>
                                        <td class="table-center-align"><input class="attribute-input" type="number" value="0" name="inputModifier" id="inputModifier"></td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">Skills</td>
                                        <td class="table-center-align">
                                            <select id="skillSelect" name="skills">
                                                <option value="None">None</option>
                                                ${skillOptions.join('')}
                                            </select>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                    </div>`,
            buttons: {
                one: {
                    label: 'Cancel',
                    callback: html => console.log('Cancelled')
                },
                two: {
                    label: 'Roll',
                    callback: async html => {
                        // Grab the selected options
                        let attributeTestSelect = html[0].querySelector('#attributeTestSelect').value
                        let userInputModifier = Number(html[0].querySelector('#inputModifier').value)
                        let selectedSkill = this.actor.getEmbeddedDocument("Item", html[0].querySelector('#skillSelect').value)

                        // Set values for options
                        let attributeValue = attributeTestSelect === 'Simple' ? this.actor.system.primaryAttributes[attributeLabel.toLowerCase()].value * 2 : this.actor.system.primaryAttributes[attributeLabel.toLowerCase()].value
                        let skillValue = selectedSkill != undefined ? selectedSkill.system.level : 0

                        // Calculate total modifier to roll
                        let rollMod = (attributeValue + skillValue + userInputModifier)

                        // Roll Dice
                        let roll = await new Roll('1d10').evaluate()

                        // Calculate total result after modifiers
                        let totalResult = Number(roll.result) + rollMod

                        // Create Chat Message Content
                        let tags = []
                        let ruleOfDiv = ``
                        if (userInputModifier != 0) { tags.push(`<span class="${userInputModifier >= 0 ? "bonusColorClass" : 'penaltyColorClass'}">User Modifier ${userInputModifier >= 0 ? "+" : ''}${userInputModifier}</span>`) }
                        if (selectedSkill != undefined) {
                            const skillLevel = selectedSkill.system.level;
                            tags.push(`<span class="${skillLevel >= 0 ? 'bonusColorClass' : 'penaltyColorClass'}">${selectedSkill.name} ${skillLevel >= 0 ? '+' : ''}${skillLevel}</span>`)
                        }

                        if (roll.result == 10) {
                            ruleOfDiv = `<h2 class="rule-of-chat-text">Rule of 10!</h2>
                                        <button type="button" data-roll="roll-again" class="rule-of-ten">Roll Again</button>`
                            totalResult = 10
                        }
                        if (roll.result == 1) {
                            ruleOfDiv = `<h2 class="rule-of-chat-text">Rule of 1!</h2>
                                        <button type="button" data-roll="roll-again" class="rule-of-one">Roll Again</button>`
                            totalResult = 1
                        }

                        let chatContent = `<form>
                                                <h2>${attributeLabel} Roll [ ${this.actor.system.primaryAttributes[attributeLabel.toLowerCase()].value} ] - ${attributeTestSelect} Test</h2>
                                                <div class="witchcraft-tags-flex-container"><b>Modifiers</b>: ${tags.join(' | ')}</div>
                                                <table class="witchcraft-chat-roll-table">
                                                    <thead>
                                                        <tr>
                                                            <th class="table-center-align">Roll</th>
                                                            <th class="table-center-align">Modifier</th>
                                                            <th class="table-center-align">Result</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td class="table-center-align" data-roll="dice-result">[[${roll.result}]]</td>
                                                            <td class="table-center-align" data-roll="modifier">${rollMod}</td>
                                                            <td class="table-center-align" data-roll="dice-total" data-roll-value="${totalResult}">${totalResult + rollMod}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>

                                                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%;">
                                                    ${ruleOfDiv}
                                                </div>
                                            </form>`

                        ChatMessage.create({
                            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                            user: game.user.id,
                            speaker: ChatMessage.getSpeaker(),
                            content: chatContent,
                            roll: roll
                        })

                    }
                }
            },
            default: 'two',
            close: html => console.log()
        }, dialogOptions)

        d.render(true)
    }

    _onDamageRoll(event) {
        event.preventDefault()
        let element = event.currentTarget
        let weapon = this.actor.getEmbeddedDocument("Item", element.closest('.item').dataset.itemId)

        // Create Classes for Dialog Box
        let mode = game.settings.get("witchcraft", "dark-mode") ? "dark-mode" : ""
        let dialogOptions = { classes: ["dialog", "witchcraft", mode] }

        // Create Dialog Prompt
        let d = new Dialog({
            title: 'Weapon Roll',
            content: `<div class="witchcraft-dialog-menu">

                            <div class="witchcraft-dialog-menu-text-box">
                                <p><strong>If a ranged weapon</strong>, select how many shots to take and select weapon firing mode. The number of shots
                                fired will be reduced from the weapon's current load capacity. Make sure you have enough ammo in the chamber!</p>

                                <p>Otherwise, leave default and click roll.</p>
                            </div>

                            <div>
                                <h2>Options</h2>
                                <table>
                                    <tbody>
                                        <tr>
                                            <th># of Shots</th>
                                            <td>
                                                <input type="number" id="shotNumber" name="shotNumber" value="0">
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>Firing Mode</th>
                                            <td>
                                                <select id="firingMode" name="firingMode">
                                                    <option>None/Melee</option>
                                                    <option>Semi-Auto</option>
                                                    <option>Burst Fire</option>
                                                    <option>Auto-Fire</option>
                                                </select>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                    <div>`,

            buttons: {
                one: {
                    label: 'Cancel',
                    callback: html => console.log('Cancelled')
                },
                two: {
                    label: 'Roll',
                    callback: async html => {
                        // Grab Values from Dialog
                        let shotNumber = html[0].querySelector('#shotNumber').value
                        let firingMode = html[0].querySelector('#firingMode').value

                        let roll = await new Roll(weapon.system.damage_string).evaluate()

                        let tags = []
                        if (firingMode != 'None/Melee') { tags.push(`<div><b>${firingMode}</b>: ${shotNumber == 1 ? shotNumber + " shot" : shotNumber + " shots"}</div>`) }

                        // Reduce Fired shots from current load chamber
                        if (shotNumber > 0) {
                            switch (weapon.system.capacity.value - shotNumber >= 0) {
                                case true:
                                    weapon.update({ 'system.capacity.value': weapon.system.capacity.value - shotNumber })
                                    break

                                case false:
                                    return ui.notifications.info(`You do not have enough ammo loaded to fire ${shotNumber} rounds!`)
                            }
                        }

                        // Create Chat Content
                        let chatContent = `<div>
                                                <h2>Damage Roll: ${weapon.name}</h2>

                                                <table class="witchcraft-chat-roll-table">
                                                    <thead>
                                                        <tr>
                                                            <th class="table-center-align">Damage</th>
                                                            <th class="table-center-align">Type</th>
                                                            <th class="table-center-align">Detail</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td class="table-center-align">[[${roll.result}]]</td>
                                                            <td class="table-center-align">${weapon.system.damage_types[weapon.system.damage_type]}</td>
                                                            <td class="table-center-align">${weapon.system.damage_string}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>`

                        ChatMessage.create({
                            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                            user: game.user.id,
                            speaker: ChatMessage.getSpeaker(),
                            flavor: `<div class="witchcraft-tags-flex-container-item">${tags.join('')}</div>`,
                            content: chatContent,
                            roll: roll
                        })
                    }
                }
            },
            default: "two",
            close: html => console.log()
        }, dialogOptions)

        d.render(true)
    }

    async _onArmorRoll(event) {
        event.preventDefault()
        let element = event.currentTarget
        let equippedItem = this.actor.getEmbeddedDocument("Item", element.closest('.item').dataset.itemId)

        let roll = await new Roll(equippedItem.system.armor_value).evaluate()

        // Create Chat Content
        let chatContent = `<div>
                                <h2>Armor Roll: ${equippedItem.name}</h2>

                                <table class="witchcraft-chat-roll-table">
                                    <thead>
                                        <tr>
                                            <th class="table-center-align">Result</th>
                                            <th class="table-center-align">Detail</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td class="table-center-align">[[${roll.result}]]</td>
                                            <td class="table-center-align">${equippedItem.system.armor_value}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>`

        ChatMessage.create({
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            user: game.user.id,
            speaker: ChatMessage.getSpeaker(),
            content: chatContent,
            roll: roll
        })
    }

    _onToggleEquipped(event) {
        event.preventDefault()
        let element = event.currentTarget
        let equippedItem = this.actor.getEmbeddedDocument("Item", element.closest('.item').dataset.itemId)

        switch (equippedItem.system.equipped) {
            case true:
                equippedItem.update({ 'system.equipped': false })
                break

            case false:
                equippedItem.update({ 'system.equipped': true })
                break
        }
    }

    _onResetResource(event) {
        event.preventDefault()
        const element = event.currentTarget
        const dataPath = `system.secondaryAttributes.${element.dataset.resource}.value`

        this.actor.update({ [dataPath]: this.actor.system.secondaryAttributes[element.dataset.resource].max })
    }

    _createStatusTags() {
        let tagContainer = this.form.querySelector('.tags-flex-container')
        let encTag = document.createElement('div')

        // Create Encumbrance Tags & Append
        switch (this.actor.system.encumbrance.level) {
            case 1:
                encTag.innerHTML = `<div>Lightly Encumbered</div>`
                encTag.classList.add('tag')
                tagContainer.append(encTag)
                break

            case 2:
                encTag.innerHTML = `<div>Moderately Encumbered</div>`
                encTag.classList.add('tag')
                tagContainer.append(encTag)
                break

            case 3:
                encTag.innerHTML = `<div>Heavily Encumbered</div>`
                encTag.classList.add('tag')
                tagContainer.append(encTag)
                break
        }
    }

}
