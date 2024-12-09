export class witchcraftActorSheet extends ActorSheet {

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
        const power = [];
        const quality = [];
        const skill = [];
        const drawback = [];

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

                case "power":
                    power.push(i)
                    break

                case "quality":
                    quality.push(i)
                    break

                case "skill":
                    skill.push(i)
                    break

                case "drawback":
                    drawback.push(i)
                    break
            }
        }

        // Alphabetically sort all items
        const itemCats = [item, equippedItem, weapon, power, quality, skill, drawback]
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
        actorData.power = power
        actorData.quality = quality
        actorData.skill = skill
        actorData.drawback = drawback
    }

    get template() {
        const path = "systems/witchcraft/templates";
        if (!game.user.isGM && this.actor.limited) return "systems/witchcraft/templates/limited-character-sheet.hbs";
        return `${path}/${this.actor.type}-sheet.hbs`;
    }

    /** @override */
    async activateListeners(html) {
        super.activateListeners(html);

        // Run non-event functions
        this._createCharacterPointDivs()
        this._createStatusTags()

        // Buttons and Event Listeners
        html.find('.attribute-roll').click(this._onAttributeRoll.bind(this))
        if(this.actor.isOwner) html.find('.damage-roll').click(this._onDamageRoll.bind(this))
        html.find('.toggleEquipped').click(this._onToggleEquipped.bind(this))
        html.find('.armor-button-cell button').click(this._onArmorRoll.bind(this))
        html.find('.reset-resource').click(this._onResetResource.bind(this))

        // Update/Open Inventory Item
        html.find('.create-item').click(this._createItem.bind(this))

        html.find('.item-name').click((ev) => {
            const li = ev.currentTarget.closest(".item")
            const item = this.actor.items.get(li.dataset.itemId)
            if (item.isOwner) {
                item.sheet.render(true)
            }
            item.update({ "data.value": item.system.value })
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

    _createCharacterPointDivs() {
        let actorData = this.actor.system
        let attributesHeader = this.form.querySelector('#attributes-header')
        let qualityDiv = document.createElement('div')
        let drawbackDiv = document.createElement('div')
        let skillDiv = document.createElement('div')
        let powerDiv = document.createElement('div')
        let characterTypePath = actorData.characterTypes[actorData.characterType]

        // Construct and assign div elements to the headers
        if (characterTypePath != undefined && !this.actor.limited) {
            attributesHeader.innerHTML += ` - [${actorData.characterTypeValues[characterTypePath].attributePoints.value} / ${actorData.characterTypeValues[characterTypePath].attributePoints.max}]`

            qualityDiv.innerHTML = `- [${actorData.characterTypeValues[characterTypePath].qualityPoints.value} / ${actorData.characterTypeValues[characterTypePath].qualityPoints.max}]`
            this.form.querySelector('#quality-header').append(qualityDiv)

            drawbackDiv.innerHTML = `- [${actorData.characterTypeValues[characterTypePath].drawbackPoints.value} / ${actorData.characterTypeValues[characterTypePath].drawbackPoints.max}]`
            this.form.querySelector('#drawback-header').append(drawbackDiv)

            skillDiv.innerHTML = `- [${actorData.characterTypeValues[characterTypePath].skillPoints.value} / ${actorData.characterTypeValues[characterTypePath].skillPoints.max}]`
            this.form.querySelector('#skill-header').append(skillDiv)

            powerDiv.innerHTML = `- [${actorData.characterTypeValues[characterTypePath].metaphysicsPoints.value} / ${actorData.characterTypeValues[characterTypePath].metaphysicsPoints.max}]`
            this.form.querySelector('#power-header').append(powerDiv)
        }
    }

    _onAttributeRoll(event) {
        event.preventDefault()
        let element = event.currentTarget
        let attributeLabel = element.dataset.attributeName
        let actorData = this.actor.system

        // Create options for Qualities/Drawbacks/Skills
        let skillOptions = []
        for (let skill of this.actor.items.filter(item => item.type === 'skill')) {
            let option = `<option value="${skill.id}">${skill.name} ${skill.system.level}</option>`
            skillOptions.push(option)
        }

        let qualityOptions = []
        for (let quality of this.actor.items.filter(item => item.type === 'quality')) {
            let option = `<option value="${quality.id}">${quality.name} ${quality.system.bonus}</option>`
            qualityOptions.push(option)
        }

        let drawbackOptions = []
        for (let drawback of this.actor.items.filter(item => item.type === 'drawback')) {
            let option = `<option value="${drawback.id}">${drawback.name} ${drawback.system.bonus}</option>`
            drawbackOptions.push(option)
        }

        // Create penalty tags from Resource Loss Status
        let penaltyTags = []
        if (actorData.secondaryAttributes.endurance_points.loss_toggle) { penaltyTags.push(`<span class="penaltyColorClass">Endurance Loss ${actorData.secondaryAttributes.endurance_points.loss_penalty}</span>`) }
        if (actorData.secondaryAttributes.essence.loss_toggle) { penaltyTags.push(`<span class="penaltyColorClass">Essence Loss ${actorData.secondaryAttributes.essence.loss_penalty}</span>`) }

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
                                    <p>Apply modifiers from the character's applicable Qualities, Drawbacks, or Skills.</p>
                                    
                                    <ul>
                                        <li>Difficult Test: 1x Attribute</li>
                                        <li>Simple Test: 2x Attribute</li>
                                    </ul>
                                </div>
                            </div>

                            <div class="witchcraft-tags-flex-container">
                                <b>Penalties</b>: ${penaltyTags.join(' | ')}
                            </div>


                            <table>
                                <tbody>
                                    <tr>
                                        <td class="table-bold-text">Attribute Test</td>
                                        <td>
                                            <select id="attributeTestSelect" name="attributeTest">
                                                <option value="Difficult">Difficult</option>
                                                <option value="Simple">Simple</option>
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">Roll Modifier</td>
                                        <td><input class="attribute-input" type="number" value="0" name="inputModifier" id="inputModifier"></td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">Skills</td>
                                        <td>
                                            <select id="skillSelect" name="skills">
                                                <option value="None">None</option>
                                                ${skillOptions.join('')}
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">Qualities</td>
                                        <td>
                                            <select id="qualitySelect" name="qualities">
                                                <option value="None">None</option>
                                                ${qualityOptions.join('')}
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">Drawbacks</td>
                                        <td>
                                            <select id="drawbackSelect" name="drawbacks">
                                                <option value="None">None</option>
                                                ${drawbackOptions.join('')}
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
                        let selectedQuality = this.actor.getEmbeddedDocument("Item", html[0].querySelector('#qualitySelect').value)
                        let selectedDrawback = this.actor.getEmbeddedDocument("Item", html[0].querySelector('#drawbackSelect').value)

                        // Set values for options
                        let attributeValue = attributeTestSelect === 'Simple' ? actorData.primaryAttributes[attributeLabel.toLowerCase()].value * 2 : actorData.primaryAttributes[attributeLabel.toLowerCase()].value
                        let skillValue = selectedSkill != undefined ? selectedSkill.system.level : 0
                        let qualityValue = selectedQuality != undefined ? selectedQuality.system.bonus : 0
                        let drawbackValue = selectedDrawback != undefined ? selectedDrawback.system.bonus : 0
                        let statusPenalties = actorData.secondaryAttributes.endurance_points.loss_penalty + actorData.secondaryAttributes.essence.loss_penalty

                        // Calculate total modifier to roll
                        let rollMod = (attributeValue + skillValue + qualityValue + userInputModifier) - Math.abs(drawbackValue) + statusPenalties

                        // Roll Dice
                        let roll = await new Roll('1d10').evaluate()

                        // Calculate total result after modifiers
                        let totalResult = Number(roll.result) + rollMod

                        // Create Chat Message Content

                        // let tags = [`<div>${attributeTestSelect} Test</div>`]
                        let tags = [];
                        let ruleOfDiv = ``
                        if (userInputModifier != 0) { 
                            tags.push(`<span class="${userInputModifier >= 0 ? "bonusColorClass" : 'penaltyColorClass'}">User Modifier ${userInputModifier >= 0 ? "+" : ''}${userInputModifier}</span>`) 
                        }
                        if (selectedSkill != undefined) { 
                            const skillLevel = selectedSkill.system.level;
                            tags.push(`<span class="${skillLevel >= 0 ? 'bonusColorClass' : 'penaltyColorClass'}">${selectedSkill.name} ${skillLevel >= 0 ? '+' : ''}${skillLevel}</span>`) 
                        }
                        if (selectedQuality != undefined) { 
                            const qualityBonus = selectedQuality.system.bonus;
                            tags.push(`<span class="${qualityBonus >= 0 ? 'bonusColorClass' : 'penaltyColorClass'}">${selectedQuality.name} ${qualityBonus >= 0 ? '+' : ''}${qualityBonus}</span>`) 
                        }
                        if (selectedDrawback != undefined) { 
                            const drawbackPenalty = selectedDrawback.system.bonus;
                            tags.push(`<span class="penaltyColorClass">${selectedDrawback.name} ${drawbackPenalty >= 0 ? '-' : ''}${drawbackPenalty}</span>`) 
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
                                                <h2>${attributeLabel} Roll [ ${actorData.primaryAttributes[attributeLabel.toLowerCase()].value} ] - ${attributeTestSelect} Test</h2>

                                                <div class="witchcraft-tags-flex-container" > <b>Modifiers</b>: ${ tags.join(' | ') } ${ penaltyTags.length > 0 ? " | " + penaltyTags.join(' | ') : "" }</div>
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
                                                            <td class="table-center-align" data-roll="dice-total" data-roll-value="${totalResult}">${totalResult}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>

                                                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%;">
                                                    ${ruleOfDiv}
                                                </div>
                                            </form>`

                        ChatMessage.create({
                            type: CONST.CHAT_MESSAGE_STYLES.ROLL,
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

    async _onDamageRoll(event) {
        event.preventDefault()
        let element = event.currentTarget
        let weapon = this.actor.getEmbeddedDocument("Item", element.closest('.item').dataset.itemId)
        
        // Create Classes for Dialog Box
        let mode = game.settings.get("witchcraft", "dark-mode") ? "dark-mode" : ""
        let dialogOptions = { classes: ["dialog", "witchcraft", mode] }

        // Create Dialog Box
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

                        const roll = await new Roll(weapon.system.damage_string).evaluate()

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
                            type: CONST.CHAT_MESSAGE_STYLES.ROLL,
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
            type: CONST.CHAT_MESSAGE_STYLES.ROLL,
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
        const actorData = this.actor.system
        const element = event.currentTarget
        const dataPath = `system.secondaryAttributes.${element.dataset.resource}.value`
        const resetResourceValue = actorData.secondaryAttributes[element.dataset.resource].max
        this.actor.update({ [dataPath]: resetResourceValue })
    }

    _createStatusTags() {
        let tagContainer = this.form.querySelector('.tags-flex-container')
        let encTag = document.createElement('div')
        let enduranceTag = document.createElement('div')
        let essenceTag = document.createElement('div')
        let injuryTag = document.createElement('div')
        let actorData = this.actor.system

        // Create Essence Tag and & Append
        if (actorData.secondaryAttributes.essence.value <= 1) {
            essenceTag.innerHTML = `<div>Hopeless</div>`
            essenceTag.title = 'All Tests suffer -3 penalty'
            essenceTag.classList.add('tag')
            tagContainer.append(essenceTag)
        }
        else if (actorData.secondaryAttributes.essence.value <= (actorData.secondaryAttributes.essence.max / 2)) {
            essenceTag.innerHTML = `<div>Forlorn</div>`
            essenceTag.title = 'Mental tests suffer a -1 penalty'
            essenceTag.classList.add('tag')
            tagContainer.append(essenceTag)
        }

        // Create Endurance Tag and & Append
        if (actorData.secondaryAttributes.endurance_points.value <= 5) {
            enduranceTag.innerHTML = `<div>Exhausted</div>`
            enduranceTag.title = 'All Tests suffer -2 penalty'
            enduranceTag.classList.add('tag')
            tagContainer.append(enduranceTag)
        }

        // Create Injury Tag and & Append
        if (actorData.secondaryAttributes.hp.value <= -10) {
            injuryTag.innerHTML = `<div>Dying</div>`
            injuryTag.classList.add('tag')
            injuryTag.title = 'Survival Test required to avoid instant death'
            tagContainer.append(injuryTag)
        }
        else if (actorData.secondaryAttributes.hp.value <= 0) {
            injuryTag.innerHTML = `<div>Semi-Conscious</div>`
            injuryTag.classList.add('tag')
            injuryTag.title = 'Willpower test required to regain consciousness, penalized by the number their HP is below 0'
            tagContainer.append(injuryTag)
        }
        else if (actorData.secondaryAttributes.hp.value <= 5) {
            injuryTag.innerHTML = `<div>Severely Injured</div>`
            injuryTag.classList.add('tag')
            injuryTag.title = 'Most actions suffer -1 through -5 penalty'
            tagContainer.append(injuryTag)
        }

        // Create Encumbrance Tags & Append
        switch (actorData.encumbrance.level) {
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
