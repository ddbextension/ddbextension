const tableroll = "tableroll";
const charfavicon = "charfavicon";
const mycharacterfolders = "mycharacterfolders";
const campaigncharacterfolders = "campaigncharacterfolders";
const editorButton = "editorButton";
const fullscreenButton = "fullscreenButton";
const tooltipsTab = "tooltipsTab";
const tablesTab = "tablesTab";
const homebrewTooltips = "homebrewtooltips";
const customTooltips = "customTooltips";
const refTooltips = "refTooltips";
const refButtons = "refButtons";

const allOptions = [
    tableroll,
    charfavicon,
    mycharacterfolders,
    campaigncharacterfolders,
    editorButton,
    fullscreenButton,
    tooltipsTab,
    tablesTab,
    homebrewTooltips,
    customTooltips,
    refTooltips,
    refButtons
];

class Options {
    static get TableRolls(): string {
        return tableroll;
    }
    static get CharacterFavIcon(): string {
        return charfavicon;
    }
    static get MyCharactersFolders(): string {
        return mycharacterfolders;
    }
    static get CampaignCharactersFolders(): string {
        return campaigncharacterfolders;
    }
    static get EditorButton(): string {
        return editorButton;
    }
    static get FullscreenButton(): string {
        return fullscreenButton;
    }
    static get TooltipsTab(): string {
        return tooltipsTab;
    }
    static get TablesTab(): string {
        return tablesTab;
    }
    static get HomebrewTooltips(): string {
        return homebrewTooltips;
    }
    static get CustomTooltips(): string {
        return customTooltips;
    }
    static get RefTooltips(): string {
        return refTooltips;
    }
    static get RefButtons(): string {
        return refButtons;
    }

    static get AllOptions(): string[] {
        return allOptions.map(option => option);
    }
}

export default Options;