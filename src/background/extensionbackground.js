import C from "../Constants";
import MessageService from "../services/MessageService";
import TooltipsService from "../contentscript/tooltips/TooltipsService";
import UserService from "../services/UserService";

/* global chrome */

// listen the dndbeyound request to gather a more info
// sends a message to the content script to render the add monster buttons and parse roll tables
chrome.webRequest.onCompleted.addListener((details) => details.tabId >= 0 && MessageService.sendToTab(details.tabId, C.RowLoadedMessage), {
    urls: [
        "*://*.dndbeyond.com/magic-items/*/more-info",
        "*://*.dndbeyond.com/monsters/*/more-info",
        "*://*.dndbeyond.com/spells/*/more-info",
        "*://*.dndbeyond.com/characters/backgrounds/*/more-info",
        "*://*.dndbeyond.com/characters/feats/*/more-info"
    ]
});

// listen tooltip request errors
// sends a message to the content script to handle it
chrome.webRequest.onErrorOccurred.addListener((details) => details.tabId >= 0 && MessageService.sendToTab(details.tabId, C.TooltipErrorMessage, details), {
    urls: [
        "*://*.dndbeyond.com/magic-items/*/tooltip*",
        "*://*.dndbeyond.com/monsters/*/tooltip*",
        "*://*.dndbeyond.com/spells/*/tooltip*"
    ]
});

// listen comment created, edited, deleted, undeleted
// sends a message to the content script to handle it - basically to init tooltips on it
chrome.webRequest.onCompleted.addListener((details) => details.tabId >= 0 && MessageService.sendToTab(details.tabId, C.CommentChangedMessage), {
    urls: [
        "*://*.dndbeyond.com/comments/*"
    ]
});

// listen the request to get the username
MessageService.listen(C.UsernameMessage, (message, callback: Function) => {
    UserService.getCurrentUsername().then(callback);
    return true;
});

// listen the request from client page to build a custom tooltip content
MessageService.listenFromExternal(C.BuildTooltipMessage, (tooltipInfo, callback) => {
    TooltipsService.buildCustomTooltipContent(tooltipInfo).then(callback).catch(callback);
    return true;
});

// functions for existing data testing
window.ddbxdump = function () {
    chrome.storage.sync.get(undefined, storageData => console.log(JSON.stringify(storageData)));
};
window.ddbxload = function (data: string) {
    chrome.storage.sync.clear(() => chrome.storage.sync.set(JSON.parse(data)));
};