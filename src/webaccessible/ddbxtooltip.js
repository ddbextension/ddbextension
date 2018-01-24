(function () {
    // This info is set when a mouseover occurs.
    // It is important to save this info on another variable because during the time one tooltip
    // is loading this info can change on the global DDBX object.
    const info = DDBX.tooltip;
    info.action = "buildtooltipmessage";

    chrome.runtime.sendMessage(DDBX.id, info, (content) => {
        Waterdeep.CurseTip.handleTooltipData({
            SimpleOrAdvanced: "simple",
            Tooltip: content,
            Url: document.location.protocol + info.cacheUrl
        });
    });
})();