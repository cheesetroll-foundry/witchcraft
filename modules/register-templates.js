/** Register Handlebars template partials */
export function registerTemplates() {
    const templatePaths = [
        //Sheet Components
        "systems/witchcraft/templates/components/primary-attributes.hbs",
        "systems/witchcraft/templates/components/secondary-attributes.hbs",
        "systems/witchcraft/templates/components/aspects.hbs",
        "systems/witchcraft/templates/components/biography.hbs",
		"systems/witchcraft/templates/components/notes.hbs",
        "systems/witchcraft/templates/components/drawbacks.hbs",
        "systems/witchcraft/templates/components/equipment-header.hbs",
        "systems/witchcraft/templates/components/items.hbs",
        "systems/witchcraft/templates/components/item-description-sidebar.hbs",
        "systems/witchcraft/templates/components/portrait.hbs",
        "systems/witchcraft/templates/components/powers.hbs",
        "systems/witchcraft/templates/components/skills.hbs",
        "systems/witchcraft/templates/components/weapons.hbs",
        "systems/witchcraft/templates/components/qualities.hbs",
        "systems/witchcraft/templates/components/item-attribute-sidebar.hbs",
        "systems/witchcraft/templates/components/item-sheet-header.hbs",
        "systems/witchcraft/templates/components/vehicle-attributes.hbs",
        "systems/witchcraft/templates/components/character-details.hbs"
    ];

    loadTemplates(templatePaths);
}