(function (DDBX) {
    tinymce.PluginManager.add("ddbx", function (editor, url) {
        "use strict";

        if (DDBX.config.editorButton && (DDBX.config.tooltipsTab || DDBX.config.tablesTab)) {
            const openDDBXWindow = function () {
                editor.windowManager.open({
                    title: "DDB Extension",
                    url: url + "/tinymceddbxdialog.html",
                    bodyType: "tabpanel",
                    width: 800,
                    height: 400
                });
            };

            editor.addButton("ddbx", {
                context: "tools",
                tooltip: "DDB Extension (Alt + B)",
                subtype: "ddbx-tinymce-button",
                onclick: openDDBXWindow,
                onPostRender: function () {
                    if (!DDBX.config.tablesTab) return;
                    const ctrl = this;
                    editor.on("NodeChange", e => {
                        const jqNode = $(editor.selection.getNode());
                        ctrl.active(jqNode.closest("table.compendium-left-aligned-table").length > 0);
                    });
                }
            });

            editor.shortcuts.add("alt+b", "Opens DDB Extension Window.", openDDBXWindow);
        }

        if (DDBX.config.fullscreenButton) {
            editor.addButton("ddbxfullscreen", {
                icon: "fullscreen",
                context: "tools",
                tooltip: "Toggle Fullscreen (Alt + F)",
                subtype: "ddbx-fullscreen-tinymce-button",
                onclick: () => editor.execCommand("mceFullscreen")
            });

            editor.shortcuts.add("alt+f", "Toggle Fullscreen.", "mceFullscreen");
        }
    });
})(DDBX);