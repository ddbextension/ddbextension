import "./extensioncontentstyle.scss";

import $ from "jquery";
import C from "../Constants";
import CampaignCharactersService from "./characters/CampaignCharactersService";
import CharacterSheetService from "./characters/CharacterSheetService";
import DiscordService from "../services/DiscordService";
import ConfigStorageService from "../services/storage/ConfigStorageService";
import Configuration from "../data/Configuration";
import ContentScriptService from "./ContentScriptService";
import FavIconService from "./favicon/FavIconService";
import MessageService from "../services/MessageService";
import MyCharactersService from "./characters/MyCharactersService";
import Opt from "../Options";
import PageScriptService from "../services/PageScriptService";
import React from 'react';
import ReactDOM from 'react-dom';
import ReferencesService from "./references/ReferencesService";
import TableRollService from "./tableroll/TableRollService";
import TinyMCEService from "./tinymce/TinyMCEService";
import TooltipsService from "./tooltips/TooltipsService";

const tooltipsInit = function (config: Configuration) {
    // workaround for homebrew spell tooltips that sever removes classes
    if (config[Opt.HomebrewTooltips]) TooltipsService.homebrewSpellTooltipWorkaround();

    // inits custom tooltips (backgrounds and feats) and ref tooltips
    if (config[Opt.CustomTooltips] || config[Opt.RefTooltips]) TooltipsService.ddbxTooltipsInit();
};

// inits the table rollers
const tablesInit = function (config: Configuration) {
    if (config[Opt.TableRolls]) TableRollService.init();
};

const init = function (config: Configuration) {
    tablesInit(config);
    tooltipsInit(config);
};

// listen a row loaded message to init table rows and tooltips
MessageService.listen(C.RowLoadedMessage, () => ConfigStorageService.getConfig().then(init));

// listen the message of comment changed
MessageService.listen(C.CommentChangedMessage, () => ConfigStorageService.getConfig().then(config => {
    tablesInit(config);
    tooltipsInit(config);
}));


ConfigStorageService.getConfig().then((config: Configuration) => {
    ContentScriptService.init(config);

    init(config);

    // force character sheet
    CharacterSheetService.init();

    // change fav icon of char page
    if (config[Opt.CharacterFavIcon]) FavIconService.changeCharacterFavIcon();

    // change my characters page
    if (config[Opt.MyCharactersFolders]) MyCharactersService.init();

    // change campaign page
    if (config[Opt.CampaignCharactersFolders]) CampaignCharactersService.init();

    // adds the DDB Extension plugin to tiny editors on page
    if (config[Opt.EditorButton] || config[Opt.FullscreenButton]) TinyMCEService.init();

    // handles errors loading tooltips
    if (config[Opt.HomebrewTooltips]) TooltipsService.listenTooltipError();

    // inits the refs on compendium pages
    if (config[Opt.RefButtons]) ReferencesService.init();

    // discord
    if (config[Opt.DiscordEnabled]) DiscordService.init(config);
});