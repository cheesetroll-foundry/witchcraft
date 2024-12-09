export function registerHandlebarsHelpers(){

    Handlebars.registerHelper("log", function (content) {
        console.log(content);
    });

    Handlebars.registerHelper("isVehicle", function () {
        const bool = this.item.parent.type == "vehicle"
        return bool;
    });
}