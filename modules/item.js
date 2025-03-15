export class witchcraftItem extends Item {

    async prepareData() {
        super.prepareData()

        // Get the Item's data & Actor's data
        const itemData = this.system
        const actorData = this.actor ? this.actor.system : {}

        // Prepare Data based on item type
        if (itemData && actorData) {
            switch (this.type) {
                case 'quality':
                case 'drawback':
                case 'aspect':
                    this._prepareQualityDrawback(actorData, itemData)
                    break

                case 'skill':
                case 'power':
                    this._prepareSkillPower(actorData, itemData)
                    break

                case 'weapon':
                    this._prepareWeaponItem(actorData, itemData)
                    break
            }
        }
    }

    _prepareQualityDrawback(actorData, itemData) { }

    _prepareSkillPower(actorData, itemData) { }

    _prepareWeaponItem(actorData, itemData) {
        // Build Damage String by combining Damage Entry with Damage Multiplier Entry (Looks at Actor to grab Multiplier Value)
        // This does not apply to weapons on vehicles
        if (this.isEmbedded && this.actor.type != 'vehicle') {
            
            if (typeof (itemData.damage_cha_multiplier_modifier) == "number") {
            	if (itemData.damage_cha_multiplier != "none") {
	                itemData.damage_string = `${itemData.damage}*${(actorData.primaryAttributes[itemData.damage_cha_multiplier].value) + itemData.damage_cha_multiplier_modifier + (itemData.damage_type == 1 ? 1 : 0)}`
	            } else {
	            	itemData.damage_string = `${itemData.damage}*${itemData.damage_cha_multiplier_modifier + (itemData.damage_type == 1 ? 1 : 0)}`
	            }
            } else {
                itemData.damage_string = `${itemData.damage}*${actorData.primaryAttributes[itemData.damage_cha_multiplier].value + (itemData.damage_type == 1 ? 1 : 0)}`
            }
        }
        else {
            itemData.damage_string = itemData.damage
        }
    }
}
