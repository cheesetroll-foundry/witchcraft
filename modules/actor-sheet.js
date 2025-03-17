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
        const specialty = [];
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

                case "specialty":
                	//group specialties under skills
                    skill.push(i)
                    break
                    
                case "drawback":
                    drawback.push(i)
                    break
            }
        }

        // Alphabetically sort all items
        const itemCats = [item, equippedItem, weapon, power, quality, skill, specialty, drawback]
        for (let category of itemCats) {
            if (category.length > 1) {
                category.sort((a, b) => {
                    let nameA = a.system.label ? a.system.label.toLowerCase() : a.name.toLowerCase()
                    let nameB = b.system.label ? b.system.label.toLowerCase() : b.name.toLowerCase()
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
		actorData.specialty = specialty
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
        html.find('.initiative-roll').click(this._onInitiativeRoll.bind(this))

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
            attributesHeader.innerHTML += ` - [${actorData.characterTypeValues[characterTypePath].attributePoints.value} / ${actorData.characterTypeValues[characterTypePath].attributePoints.max + game.settings.get("witchcraft", "attribute-point-adjustment")}]`

            qualityDiv.innerHTML = `- [${actorData.characterTypeValues[characterTypePath].qualityPoints.value} / ${actorData.characterTypeValues[characterTypePath].qualityPoints.max + game.settings.get("witchcraft", "quality-point-adjustment")}]`
            this.form.querySelector('#quality-header').append(qualityDiv)

            drawbackDiv.innerHTML = `- [${actorData.characterTypeValues[characterTypePath].drawbackPoints.value} / ${actorData.characterTypeValues[characterTypePath].drawbackPoints.max + game.settings.get("witchcraft", "drawback-point-adjustment")}]`
            this.form.querySelector('#drawback-header').append(drawbackDiv)

            skillDiv.innerHTML = `- [${actorData.characterTypeValues[characterTypePath].skillPoints.value} / ${actorData.characterTypeValues[characterTypePath].skillPoints.max + game.settings.get("witchcraft", "skill-point-adjustment") + actorData.maxSkills}]`
            this.form.querySelector('#skill-header').append(skillDiv)

            powerDiv.innerHTML = `- [${actorData.characterTypeValues[characterTypePath].metaphysicsPoints.value} / ${actorData.characterTypeValues[characterTypePath].metaphysicsPoints.max + game.settings.get("witchcraft", "metaphysics-point-adjustment") + actorData.maxMetaphysics}]`
            this.form.querySelector('#power-header').append(powerDiv)
        }
    }

    _onAttributeRoll(event) {
        event.preventDefault()
        let element = event.currentTarget
        let attributeLabel = element.dataset.attributeName
        let actorData = this.actor.system

        // Create options for Qualities/Drawbacks/Skills/Specialties/Powers
        
        function sortOptions(optionType) {
			if (optionType.length > 1) {
				optionType.sort((a, b) => {
					let nameA = a.system.label ? a.system.label.toLowerCase() : a.name.toLowerCase()
					let nameB = b.system.label ? b.system.label.toLowerCase() : b.name.toLowerCase()
					if (nameA > nameB) { return 1 }
					else { return -1 }
				})
			}
			return optionType
        }
        
        let skillOptions = []
        for (let skill of sortOptions(this.actor.items.filter(item => (item.type === 'skill' || item.type === 'specialty')))) {
            let option = `<option value="${skill.id}">${skill.name} ${skill.system.level}</option>`
            if (skill.type == 'specialty') {
                option = `<option value="${skill.id}">${skill.system.label} ${skill.system.level}</option>`
            }
            skillOptions.push(option)
        }

        let qualityOptions = []
        for (let quality of sortOptions(this.actor.items.filter(item => item.type === 'quality' && item.system.bonus != null && item.system.bonus != 0))) {
            let option = `<option value="${quality.id}">${quality.name} ${quality.system.bonus}</option>`
            qualityOptions.push(option)
        }

        let drawbackOptions = []
        for (let drawback of sortOptions(this.actor.items.filter(item => item.type === 'drawback' && item.system.bonus != null && item.system.bonus != 0))) {
            let option = `<option value="${drawback.id}">${drawback.name} ${drawback.system.bonus}</option>`
            drawbackOptions.push(option)
        }

        let powerOptions = []
        for (let power of sortOptions(this.actor.items.filter(item => item.type === 'power'))) {
            let option = `<option value="${power.id}">${power.name} ${power.system.level}</option>`
            powerOptions.push(option)
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
                                    <tr>
                                        <td class="table-bold-text">Powers</td>
                                        <td>
                                            <select id="powerSelect" name="powers">
                                                <option value="None">None</option>
                                                ${powerOptions.join('')}
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
                        let selectedPower = this.actor.getEmbeddedDocument("Item", html[0].querySelector('#powerSelect').value)

                        // Set values for options
                        let attributeValue = attributeTestSelect === 'Simple' ? actorData.primaryAttributes[attributeLabel.toLowerCase()].value * 2 : actorData.primaryAttributes[attributeLabel.toLowerCase()].value
                        let skillValue = selectedSkill != undefined ? selectedSkill.system.level : 0
                        let qualityValue = selectedQuality != undefined ? selectedQuality.system.bonus : 0
                        let drawbackValue = selectedDrawback != undefined ? selectedDrawback.system.bonus : 0
                        let powerValue = selectedPower != undefined ? selectedPower.system.level : 0
                        let statusPenalties = actorData.secondaryAttributes.endurance_points.loss_penalty + actorData.secondaryAttributes.essence.loss_penalty

                        // Calculate total modifier to roll
                        let rollMod = (attributeValue + skillValue + qualityValue + powerValue + userInputModifier) - Math.abs(drawbackValue) + statusPenalties

                        // Roll Dice
                        let roll = await new Roll('1d10').evaluate()
                        let rollResult = Number(roll.result);
						let rollResults = [rollResult];
						let ruleOfTen = rollResult == 10 ? true : false;

                        // Create Chat Message Content

                        // let tags = [`<div>${attributeTestSelect} Test</div>`]
                        let tags = [];
                        let ruleOfDiv = ``
                        if (userInputModifier != 0) { 
                            tags.push(`<span class="${userInputModifier >= 0 ? "bonusColorClass" : 'penaltyColorClass'}">User Modifier ${userInputModifier >= 0 ? "+" : ''}${userInputModifier}</span>`) 
                        }
                        if (selectedSkill != undefined) { 
                            const skillLevel = selectedSkill.system.level;
                            if (selectedSkill.system.label != undefined) {
                                tags.push(`<span class="${skillLevel >= 0 ? 'bonusColorClass' : 'penaltyColorClass'}">${selectedSkill.system.label} ${skillLevel >= 0 ? '+' : ''}${skillLevel}</span>`)
                            } else {
                                tags.push(`<span class="${skillLevel >= 0 ? 'bonusColorClass' : 'penaltyColorClass'}">${selectedSkill.name} ${skillLevel >= 0 ? '+' : ''}${skillLevel}</span>`)
                            }
                        }
                        if (selectedQuality != undefined) { 
                            const qualityBonus = selectedQuality.system.bonus;
                            tags.push(`<span class="${qualityBonus >= 0 ? 'bonusColorClass' : 'penaltyColorClass'}">${selectedQuality.name} ${qualityBonus >= 0 ? '+' : ''}${qualityBonus}</span>`) 
                        }
                        if (selectedDrawback != undefined) { 
                            const drawbackPenalty = selectedDrawback.system.bonus;
                            tags.push(`<span class="penaltyColorClass">${selectedDrawback.name} ${drawbackPenalty >= 0 ? '-' : ''}${drawbackPenalty}</span>`) 
                        }
                        if (selectedPower != undefined) { 
                            const powerBonus = selectedPower.system.level;
                            tags.push(`<span class="${powerBonus >= 0 ? 'bonusColorClass' : 'penaltyColorClass'}">${selectedPower.name} ${powerBonus >= 0 ? '+' : ''}${powerBonus}</span>`) 
                        }
                        
                        let successLevel = 0;
                        let successLevelText = '';
                        let successLevelBonus = 0;
                        let successLevelDamageBonus = 0;
                        
						while (Number(roll.result) == 10) {
							roll = await new Roll('1d10').evaluate();
							rollResults.push(roll.result);
							if (Number(roll.result) > 6) {
								rollResult += (Number(roll.result) - 5);
							}
						}
						while (Number(roll.result) == 1 && ruleOfTen == false) {
							roll = await new Roll('1d10').evaluate();
							rollResults.push(roll.result);
							if (Number(roll.result) < 5 && Number(roll.result) > 1) {
								if (rollResult == 1) rollResult = 0;
								rollResult += (Number(roll.result) - 5);
							} else if (Number(roll.result) == 1) {
								if (rollResult == 1) rollResult = 0;
								rollResult += -5;
							}
						}
                        
                        // Calculate total result after modifiers
                        let totalResult = rollResult + rollMod;
                        if (totalResult < 9) {
                        	successLevel = 0;
                        	successLevelText = '<b>Failure.</b>';
                        }
                        if (totalResult == 9 || totalResult == 10) {
                        	successLevel = 1;
                        	successLevelText = '<b>First Level (Adequate):</b> The Task or Test got done. If an artistic endeavor, it is just adequate, and critics/audiences are likely to give it "ho-hum" responses. A complex and involved Task takes the maximum required time to complete. An attempted maneuver was barely accomplished, and might appear to be the result of luck rather than skill. Social skills produce minimal benefits for the character.<br/><b>Combat:</b> Attack does normal damage.';
                        }
                        if (totalResult == 11 || totalResult == 12) {
                        	successLevel = 2;
                        	successLevelText = '<b>Second Level (Decent):</b> The Task or Test was accomplished with relative ease and even some flair. Artistic results are above average, resulting in a warm reaction from many, but not most. Complex and involved Tasks take 10% less than the maximum required time. Attempted maneuvers are skillfully accomplished. Social skills manage to gain some benefits for the character (including a +1 to further attempts on the same people under similar situations).<br/><b>Combat:</b> Attack does normal damage.';
                        }
                        if (totalResult == 13 || totalResult == 14) {
                        	successLevel = 3;
                        	successLevelText = '<b>Third Level (Good):</b> The Task or Test was completed with ease. Artistic results are largely appreciated by connoisseurs and well-liked by the public (although some critics will be able to find something wrong). Complex and involved Tasks take 25% less time than normally required. Attempted maneuvers are done with seeming effortlessness, apparently the result of great skill. Social skills are not only successful, the character will be at +2 on future attempts on the same people (this is not cumulative with subsequent high rolls -- use the highest bonus only).<br/><b>Combat:</b> This is the roll needed to target a specific body part, or to hit a vital area.';
                        }
                        if (totalResult == 15 || totalResult == 16) {
                        	successLevel = 4;
                        	successLevelText = '<b>Fourth Level (Very Good):</b> The Task or Test was very successful. Artistic endeavors are rewarded with a great deal of appreciation from the intended audience. Complex and involved Tasks can be finished in half the time. Social skills produce a lasting impression on the people involved, resulting in a bonus of +3 on all future attempts in that skill involving the same people.<br/><b>Combat:</b> Increase the damage rolled by 1 before applying the Multiplier.';
                        }
                        if (totalResult == 17 || totalResult == 18 || totalResult == 19 || totalResult == 20) {
                        	successLevel = 5;
                        	successLevelText = '<b>Fifth Level (Excellent):</b> The Task or Test produced excellent results. Any artistic endeavor impresses the audience greatly, leading to a great deal of recognition and fame. Social skills produce a lasting impression on the people involved, resulting in a bonus of +4 on all future attempts in that skill involving the same people.<br/><b>Combat:</b> Increase the damage rolled by 2 before applying the Multiplier.';
                        }
                        if (totalResult == 21 || totalResult == 22 || totalResult == 23) {
                        	successLevel = 6;
                        	successLevelText = '<b>Sixth Level (Extraordinary):</b> The Task or Test produced amazing results, accomplishing far more than was intended. Artists gain fame after one such roll, but all their future accomplishments will be measured against this one, which may lead to the "one-shot wonder" label. Social skills produce a lasting impression on the people involved, resulting in a bonus of +5 on all future attempts in that skill involving the same people.<br/><b>Combat:</b> Increase the damage rolled by 3 before applying the Multiplier.';
                        }
                        if (totalResult > 23) {
                        	successLevel = Math.floor((totalResult-21)/3) + 6;
                        	successLevelBonus = successLevel-1;
                        	successLevelDamageBonus = successLevel-3;
                        	successLevelText = '<b>Level ' + successLevel + '(Mind-boggling):</b> The Task or Test produced amazing results, accomplishing far more than was intended. Artists gain fame after one such roll, but all their future accomplishments will be measured against this one, which may lead to the "one-shot wonder" label. Social skills produce a lasting impression on the people involved, resulting in a bonus of +' + successLevelBonus + ' on all future attempts in that skill involving the same people.<br/><b>Combat:</b> Increase the damage rolled by ' + successLevelDamageBonus + ' before applying the Multiplier.';
                        }

                        let chatContent = `<form>
                                                <b>${attributeLabel} [${actorData.primaryAttributes[attributeLabel.toLowerCase()].value}] - ${attributeTestSelect}</b>

                                                <div class="witchcraft-tags-flex-container" > <b>Modifiers</b>: ${ tags.join(' | ') } ${ penaltyTags.length > 0 ? " | " + penaltyTags.join(' | ') : "" }</div>
                                                <table class="witchcraft-chat-roll-table">
                                                    <thead>
                                                        <tr>
                                                            <th class="table-center-align">Roll(s)</th>
                                                            <th class="table-center-align">Modifier</th>
                                                            <th class="table-center-align">Result</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td class="table-center-align" data-roll="dice-result">${rollResults}</td>
                                                            <td class="table-center-align" data-roll="modifier">${rollMod}</td>
                                                            <td class="table-center-align" data-roll="dice-total" data-roll-value="${totalResult}">${totalResult}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                ${successLevelText}
                                            </form>`

                        ChatMessage.create({
                            type: CONST.CHAT_MESSAGE_STYLES.ROLL,
                            user: game.user.id,
                            speaker: ChatMessage.getSpeaker(),
                            content: chatContent
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

								<p><strong>If you rolled at least a Fourth Level success</strong>, enter your bonus damage to add before applying the multiplier.

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
                                        <tr>
                                            <th>Skill Roll Bonus Damage</th>
                                            <td>
                                                <input type="number" id="bonusDamage" name="bonusDamage" value="0">
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
						let bonusDamage = html[0].querySelector('#bonusDamage').value

                        

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

						//add bonusDamage on weapon
						let damage_string_final = weapon.system.damage_string
						if (bonusDamage != 0) {
							damage_string_final = '(' + damage_string_final.split('*')[0] + '+' + bonusDamage + ')*' + damage_string_final.split('*')[1]
						}
						
						const roll = await new Roll(damage_string_final).evaluate()

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
                                                            <td class="table-center-align">${damage_string_final}</td>
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
	
	async _onInitiativeRoll(event) {
		event.preventDefault()

		let element = event.currentTarget
		let actorData = this.actor.system
		
		let attributeLabel = actorData.secondaryAttributes.initiativeOptions[actorData.secondaryAttributes.initiativeOption]
		
		//Roll dice
		let roll = await new Roll('1d10').evaluate()
        let rollResult = Number(roll.result);
        let rollMod = actorData.primaryAttributes[attributeLabel.toLowerCase()].value
        let totalResult = rollResult + rollMod


        // Create Chat Content
        let chatContent = `<form>
								<b>Initiative Roll: ${attributeLabel} + ${rollMod}</b>
								<div class="witchcraft-tags-flex-container" ></div>
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
											<td class="table-center-align" data-roll="dice-result">${rollResult}</td>
											<td class="table-center-align" data-roll="modifier">${rollMod}</td>
											<td class="table-center-align" data-roll="dice-total" data-roll-value="${totalResult}">${totalResult}</td>
										</tr>
									</tbody>
								</table>
							</form>`

        ChatMessage.create({
            type: CONST.CHAT_MESSAGE_STYLES.ROLL,
            user: game.user.id,
            speaker: ChatMessage.getSpeaker(),
            content: chatContent,
            roll: roll
        })
        
        let combatant = game.combat.getCombatantByActor(this.actor._id)._id;
		game.combat.setInitiative(combatant, totalResult);
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
