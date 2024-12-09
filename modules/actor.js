export class afmbeActor extends Actor {
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    if (data.type === "character") {
      this.prototypeToken.updateSource({ 'sight.enabled': true, actorLink: true, disposition: 1 })
    }

    if (data.type === 'creature') {
      this.prototypeToken.updateSource({ disposition: -1 })
    }

    if (data.type === 'vehicle') {
      this.prototypeToken.updateSource({ disposition: 0 })
    }
  }

  prepareData() {
    super.prepareData()
    const actorData = this;
    const data = actorData.system;
    const flags = actorData.flags;

    if (actorData.type === 'character') { this._prepareCharacterData(actorData) }
    if (actorData.type === 'creature') { this._prepareCreatureData(actorData) }
    if (actorData.type === 'vehicle') { this._preparevehicleData(actorData) }
  }

  _prepareCharacterData(actorData) {
    const data = actorData.system

    // Set Character Point Values
    let chaTypeLabel = data.characterTypes[data.characterType]
    if (chaTypeLabel != undefined) {
      data.characterTypeValues[chaTypeLabel].attributePoints.value = this._calculateAttributePoints(data)
      data.characterTypeValues[chaTypeLabel].qualityPoints.value = this._calculateQualityPoints(data)
      data.characterTypeValues[chaTypeLabel].drawbackPoints.value = this._calculateDrawbackPoints(data)
      data.characterTypeValues[chaTypeLabel].skillPoints.value = this._calculateSkillPoints(data)
      data.characterTypeValues[chaTypeLabel].metaphysicsPoints.value = this._calculateMetaphysicsPoints(data)
    }

    // Set Encumbrance Values
    data.encumbrance.lifting_capacity = this._calculateLiftingCapacity(data)
    data.encumbrance.max = Number((data.encumbrance.lifting_capacity / 2).toFixed(0))
    data.encumbrance.value = this._calculateEncumbrance(data)
    data.encumbrance.level = this._calculateEncumbranceLevel(data)

    // Determine Secondary Attribute Maximum Values
    data.secondaryAttributes.hp.max = this._calcLifePoints(data)
    data.secondaryAttributes.endurance_points.max = this._calcEndurancePoints(data)
    this._calcSpeed(data)
    data.secondaryAttributes.essence.max = this._calcEssencePool(data)
    data.secondaryAttributes.initiative.value = this._calcInitiative(data)

    // Determine Secondary Attribute Loss Penalties
    if (data.secondaryAttributes.endurance_points.value <= 5) {
      data.secondaryAttributes.endurance_points.loss_toggle = true
      data.secondaryAttributes.endurance_points.loss_penalty = -2
    }
    else {
      data.secondaryAttributes.endurance_points.loss_toggle = false
      data.secondaryAttributes.endurance_points.loss_penalty = 0
    }

    if (data.secondaryAttributes.essence.value <= 1) {
      data.secondaryAttributes.essence.loss_toggle = true
      data.secondaryAttributes.essence.loss_penalty = -3
    }
    else {
      data.secondaryAttributes.essence.loss_toggle = false
      data.secondaryAttributes.essence.loss_penalty = 0
    }

  }

  _prepareCreatureData(actorData) {
    const data = actorData.system

    // Set Encumbrance Values
    data.encumbrance.lifting_capacity = this._calculateLiftingCapacity(data)
    data.encumbrance.max = Number((data.encumbrance.lifting_capacity / 2).toFixed(0))
    data.encumbrance.value = this._calculateEncumbrance(data)
    data.encumbrance.level = this._calculateEncumbranceLevel(data)

    // Determine Secondary Attribute Maximum Values
    data.secondaryAttributes.hp.max = this._calcLifePoints(data)
    data.secondaryAttributes.endurance_points.max = this._calcEndurancePoints(data)
    this._calcSpeed(data)
    data.secondaryAttributes.essence.max = this._calcEssencePool(data)
    data.secondaryAttributes.initiative.value = this._calcInitiative(data)

    // Calculate Power Total
    data.power = this._calculatePowerTotal(data)

  }

  _preparevehicleData(actorData) {

  }

  _calcLifePoints(data) {
    // Calculate bonuses from all items
    let itemsWithBonus = this.items.filter(item => item.system.hasOwnProperty('resource_bonus'))
    let itemBonus = 0
    for (let item of itemsWithBonus) {
      itemBonus = itemBonus + item.system.resource_bonus.hp
    }

    // Set return values depending on attribute values
    switch (data.primaryAttributes.constitution.value > 0 && data.primaryAttributes.strength.value > 0) {
      case true:
        return (4 * (data.primaryAttributes.constitution.value + data.primaryAttributes.strength.value)) + 10 + itemBonus

      case false:
        let strengthVal = data.primaryAttributes.strength.value <= 0 ? 1 : data.primaryAttributes.strength.value
        let constitutionVal = data.primaryAttributes.constitution.value <= 0 ? 1 : data.primaryAttributes.constitution.value
        return (4 * (strengthVal + constitutionVal)) + 10 + (data.primaryAttributes.constitution.value < 0 ? data.primaryAttributes.constitution.value : 0) + (data.primaryAttributes.strength.value < 0 ? data.primaryAttributes.strength.value : 0) + itemBonus
    }
  }

  _calcEndurancePoints(data) {
    // Calculate bonuses from all items
    let itemsWithBonus = this.items.filter(item => item.system.hasOwnProperty('resource_bonus'))
    let itemBonus = 0
    for (let item of itemsWithBonus) {
      itemBonus = itemBonus + item.system.resource_bonus.endurance_points
    }

    return (3 * (data.primaryAttributes.constitution.value + data.primaryAttributes.strength.value + data.primaryAttributes.willpower.value)) + 5 + itemBonus
  }

  _calcSpeed(data) {
    // Calculate bonuses from all items
    let itemsWithBonus = this.items.filter(item => item.system.hasOwnProperty('resource_bonus'))
    let itemBonus = 0
    for (let item of itemsWithBonus) {
      itemBonus = itemBonus + item.system.resource_bonus.speed
    }

    data.secondaryAttributes.speed.value = 2 * (data.primaryAttributes.constitution.value + data.primaryAttributes.dexterity.value) + itemBonus - data.encumbrance.level
    data.secondaryAttributes.speed.halfValue = (data.secondaryAttributes.speed.value / 2).toFixed(0)
  }

  _calcEssencePool(data) {
    // Calculate bonuses from all items
    let itemsWithBonus = this.items.filter(item => item.system.hasOwnProperty('resource_bonus'))
    let itemBonus = 0
    for (let item of itemsWithBonus) {
      itemBonus = itemBonus + item.system.resource_bonus.essence
    }

    return data.primaryAttributes.strength.value + data.primaryAttributes.dexterity.value + data.primaryAttributes.constitution.value + data.primaryAttributes.intelligence.value + data.primaryAttributes.perception.value + data.primaryAttributes.willpower.value + itemBonus
  }

  _calcInitiative(data) {
    // Calculate bonuses from all items
    let itemsWithBonus = this.items.filter(item => item.system.hasOwnProperty('resource_bonus'))
    let itemBonus = 0
    for (let item of itemsWithBonus) {
      itemBonus = itemBonus + item.system.resource_bonus.initiative
    }

    return data.primaryAttributes.dexterity.value + itemBonus
  }

  _calculateQualityPoints(data) {
    let total = 0
    for (let quality of this.items.filter(item => item.type === 'quality')) {
      total = total + quality.system.cost
    }
    return total
  }

  _calculateDrawbackPoints(data) {
    let total = 0
    for (let drawback of this.items.filter(item => item.type === 'drawback')) {
      total = total + drawback.system.cost
    }
    return total
  }

  _calculateSkillPoints(data) {
    let total = 0
    for (let skill of this.items.filter(item => item.type === 'skill')) {
      total = total + skill.system.level
    }
    return total
  }

  _calculateMetaphysicsPoints(data) {
    let total = 0
    for (let power of this.items.filter(item => item.type === 'power')) {
      total = total + power.system.level
    }
    return total
  }

  _calculateAttributePoints(data) {
    let attributeArray = [data.primaryAttributes.strength.value, data.primaryAttributes.dexterity.value, data.primaryAttributes.constitution.value, data.primaryAttributes.intelligence.value, data.primaryAttributes.perception.value, data.primaryAttributes.willpower.value]
    let superTotal = 0

    // Return adjusted total for values over 5
    if (attributeArray.some(attribute => attribute > 5)) {
      for (let attr of attributeArray) {
        let diff = attr - 5
        let multiplier = 3

        if (attr > 5) { superTotal = superTotal + (attr - diff) + (diff * multiplier) }
        else if (attr <= 5) { superTotal = superTotal + attr }
      }
      return superTotal
    }
    // Return Normal sum total if no value is above 5
    else { return attributeArray.reduce((a, b) => a + b) }
  }

  _calculateLiftingCapacity(data) {
    if (data.primaryAttributes.strength.value <= 5) { return 50 * data.primaryAttributes.strength.value }
    else if (data.primaryAttributes.strength.value <= 10 && data.primaryAttributes.strength.value >= 6) { return (200 * (data.primaryAttributes.strength.value - 1) + 250) }
    else if (data.primaryAttributes.strength.value <= 15 && data.primaryAttributes.strength.value >= 11) { return (500 * (data.primaryAttributes.strength.value - 10) + 1250) }
    else if (data.primaryAttributes.strength.value <= 20 && data.primaryAttributes.strength.value >= 16) { return (1000 * (data.primaryAttributes.strength.value - 15) + 5000) }
  }

  _calculateEncumbrance(data) {
    let total = 0
    for (let item of this.items.filter(i => i.system.hasOwnProperty('encumbrance'))) {
      let qty = item.system.qty != undefined ? item.system.qty : 1
      total = total + (item.system.encumbrance * qty)
    }

    return total.toFixed(1)
  }

  _calculateEncumbranceLevel(data) {
    if (data.encumbrance.value >= data.encumbrance.max * 1.51) { return 3 }
    else if (data.encumbrance.value >= data.encumbrance.max * 1.26) { return 2 }
    else if (data.encumbrance.value >= data.encumbrance.max) { return 1 }
    else { return 0 }
  }

  _calculatePowerTotal(data) {
    let total = 0
    for (let aspect of this.items.filter(item => item.type === 'aspect')) {
      total = total + aspect.system.power
    }

    return total
  }

}
