// Import Modules
import { witchcraftActorSheet } from "./actor-sheet.js";
import { witchcraftActor } from "./actor.js";
import { witchcraftItem } from "./item.js";
import { witchcraftItemSheet } from "./item-sheet.js";
import { witchcraftCreatureSheet } from "./creature-sheet.js"
import { witchcraftvehicleSheet } from "./vehicle-sheet.js"
import { registerTemplates } from "./register-templates.js";
import { registerHandlebarsHelpers } from "./handlebars.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function () {
    console.log(`Initializing WitchCraft System`);

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: "1d10 + @initiative.value",
        decimals: 0
    };

    // Define Custom Entity Classes
    CONFIG.Actor.documentClass = witchcraftActor
    CONFIG.Item.documentClass = witchcraftItem

    // Register Partial Templates
    registerTemplates();
    registerHandlebarsHelpers();

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet)

    Actors.registerSheet("witchcraft", witchcraftActorSheet,
        {
            types: ["character"],
            makeDefault: true,
            label: "Default WitchCraft Character Sheet"
        })

    Actors.registerSheet("witchcraft", witchcraftCreatureSheet,
        {
            types: ["creature"],
            makeDefault: true,
            label: "Default WitchCraft Creature Sheet"
        })

    Actors.registerSheet("witchcraft", witchcraftvehicleSheet,
        {
            types: ["vehicle"],
            makeDefault: true,
            label: "Default WitchCraft vehicle Sheet"
        })

    Items.registerSheet("witchcraft", witchcraftItemSheet,
        {
            makeDefault: true,
            label: "Default WitchCraft Item Sheet"
        })


    // Game Settings
    function delayedReload() { window.setTimeout(() => location.reload(), 500) }

    game.settings.register("witchcraft", "dark-mode", {
        name: "Dark Mode",
        hint: "Checking this option enables Dark Mode for the different sheets and items.",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
        onChange: delayedReload
    });
})

/* -------------------------------------------- */
/*  Chat Message Hooks                          */
/* -------------------------------------------- */

// Hook for Re-Rolls on Lucky/Unlucky Rolls
Hooks.on("renderChatMessage", (app, html, data) => {
    let chatButton = html[0].querySelector("[data-roll='roll-again']")

    if (chatButton != undefined && chatButton != null) {
        chatButton.addEventListener('click', async () => {
            let ruleTag = '';
            const diceResult = Number(html[0].querySelector("[data-roll='dice-result']").textContent);

            if (diceResult == 10) { ruleTag = '<b>Rule of Ten Re-Roll</b>' }
            if (diceResult == 1) { ruleTag = '<b>Rule of One Re-Roll</b>: If the first reroll is a negative value (1d10-5), it replaces the original die roll. </br><b>Exception</b>: Rolling a 1 again replaces the original roll with -5; each subsequent 1 rolled subtracts 5 from the result.' }

            let roll = await new Roll('1d10').evaluate()

            // Grab and Set Values from Previous Roll
            let attributeLabel = html[0].querySelector('h2').outerHTML + `${ruleTag}`
            let rollMod = Number(html[0].querySelector("[data-roll='modifier']").textContent)
            
            let diceTotal = Number(html[0].querySelector("[data-roll-value]").getAttribute('data-roll-value'))
            let ruleOfMod = ruleTag === 'Rule of Ten Re-Roll' ? Number(roll.result) > 5 ? Number(roll.result) - 5 : 0 : Number(roll.result) > 5 ? 0 : Number(roll.result) - 5
            
            let ruleOfDiv = ''
            
            if (ruleTag.includes('Rule of One Re-Roll') && (diceTotal == 1) && (roll.result < 5)){
                diceTotal = 0;                          
            }

            if (roll.result == 10 && !ruleTag.includes('Rule of One Re-Roll')) {
                ruleOfDiv = `<h2 class="rule-of-chat-text">Rule of 10!</h2>
                            <button type="button" data-roll="roll-again" class="rule-of-ten">Roll Again</button>`
                ruleOfMod = 5
            }
            if (roll.result == 1 && ruleTag != 'Rule of Ten Re-Roll') {
                ruleOfDiv = `<h2 class="rule-of-chat-text">Rule of 1!</h2>
                            <button type="button" data-roll="roll-again" class="rule-of-one">Roll Again</button>`
                ruleOfMod = -5
            }

            // Create Chat Content
            let tags = []
            let chatContent = `<form>
                                    ${attributeLabel}

                                    <table class="witchcraft-chat-roll-table">
                                        <thead>
                                            <tr>
                                                <th class="table-center-align">Roll</th>
                                                <th class="table-center-align">Reroll Modifier</th>
                                                <th class="table-center-align">New Result</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td class="table-center-align" data-roll="dice-result">[[${roll.result}]]</td>
                                                <td class="table-center-align" data-roll="modifier">${ruleOfMod}</td>
                                                <td class="table-center-align" data-roll="dice-total" data-roll-value="${diceTotal + ruleOfMod}">${diceTotal + ruleOfMod + rollMod}</td>
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
                flavor: `<div class="witchcraft-tags-flex-container">${tags.join('')}</div>`,
                content: chatContent,
                roll: roll
            })
        })
    }
})