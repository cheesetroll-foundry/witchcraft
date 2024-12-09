/** Register Handlebars template partials */
export function registerTemplates() {
    const templatePaths = [
        //Sheet Components
        "systems/afmbe-jesuisfrog/templates/components/primary-attributes.hbs",
        "systems/afmbe-jesuisfrog/templates/components/secondary-attributes.hbs",
        "systems/afmbe-jesuisfrog/templates/components/aspects.hbs",
        "systems/afmbe-jesuisfrog/templates/components/biography.hbs",
        "systems/afmbe-jesuisfrog/templates/components/drawbacks.hbs",
        "systems/afmbe-jesuisfrog/templates/components/equipment-header.hbs",
        "systems/afmbe-jesuisfrog/templates/components/items.hbs",
        "systems/afmbe-jesuisfrog/templates/components/item-description-sidebar.hbs",
        "systems/afmbe-jesuisfrog/templates/components/polaroid.hbs",
        "systems/afmbe-jesuisfrog/templates/components/powers.hbs",
        "systems/afmbe-jesuisfrog/templates/components/skills.hbs",
        "systems/afmbe-jesuisfrog/templates/components/weapons.hbs",
        "systems/afmbe-jesuisfrog/templates/components/qualities.hbs",
        "systems/afmbe-jesuisfrog/templates/components/item-attribute-sidebar.hbs",
        "systems/afmbe-jesuisfrog/templates/components/item-sheet-header.hbs",
        "systems/afmbe-jesuisfrog/templates/components/vehicle-attributes.hbs",
        "systems/afmbe-jesuisfrog/templates/components/character-details.hbs"
    ];

    loadTemplates(templatePaths);
}