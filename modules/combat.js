export class witchcraftCombat extends Combat {
	async rollInitiative(ids, options) {
		for (let i=0; i<ids.length; i++) {
			//find actor
			let actorId = game.combat.combatants.get(ids[i]).actorId
			let actor = game.actors.get(actorId)
			let actorData = actor.system
			
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
				user: actorId,
				speaker: ChatMessage.getSpeaker(),
				content: chatContent,
				roll: roll
			})
			
			game.combat.setInitiative(ids[i], totalResult);
		}
	}
}