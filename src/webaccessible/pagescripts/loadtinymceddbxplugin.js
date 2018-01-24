(function (DDBX) {
    const jqEditors = $(Cobalt.TinyMCE.selector);
    if (jqEditors.length === 0) return;

    // enables to close tiny windows when click outside them
    const enableCloseByClickOut = function () {
        $(document).on('click', '#mce-modal-block', function () {
            tinyMCE.activeEditor.windowManager.close();
        });
    };

    // loads the ddbx tinymce plugin
    const loadBeTinyMCEPlugin = function () {
        const executeWhenConditionMet = function (conditionFunction, toExecute) {
            const interval = setInterval(() => {
                if (!conditionFunction()) return;
                clearInterval(interval);
                toExecute();
            }, 100);
        };

        const tinyLoaded = () => typeof tinymce !== "undefined" && tinymce.editors.length > 0;

        // hide all editors untill load BE stuff too
        const jqMarkupRoots = jqEditors.parents(".markup-editor");
        jqMarkupRoots.addClass("ddbx-tinymce-loading");

        executeWhenConditionMet(tinyLoaded, () => {
            // destroy all tinymce editors
            tinymce.remove();
            Cobalt.TinyMCE.initialized = false;
            Cobalt.TinyMCE.optionsOverridden = true;

            // adds BE tinymce plugin
            if (!Cobalt.TinyMCE.options.external_plugins) Cobalt.TinyMCE.options.external_plugins = {};
            Cobalt.TinyMCE.options.external_plugins.ddbx = `chrome-extension://${DDBX.id}/webaccessible/tinymceddbxplugin.js`;

            // adds BE button on toolbar
            if (DDBX.config.editorButton && (DDBX.config.tooltipsTab || DDBX.config.tablesTab)) {
                Cobalt.TinyMCE.options.toolbar = Cobalt.TinyMCE.options.toolbar + ",|,ddbx";
            }

            // adds fullscreen button on toolbar
            if (DDBX.config.fullscreenButton) {
                Cobalt.TinyMCE.options.toolbar = Cobalt.TinyMCE.options.toolbar + ",|,ddbxfullscreen";
                Cobalt.TinyMCE.options.plugins = Cobalt.TinyMCE.options.plugins + ",fullscreen";
            }

            // reloads all editors and shows them
            Cobalt.TinyMCE.initialize();
            executeWhenConditionMet(tinyLoaded, () => jqMarkupRoots.removeClass("ddbx-tinymce-loading"));
        });
    };

    // listen messages from BE tinymce dialogs
    window.addEventListener("message", e => {
        if (e.origin !== `chrome-extension://${DDBX.id}`) return;
        const action = e.data.action;
        const editor = tinymce.activeEditor;

        // message that requests to close the BE dialog
        if (action === "closetinymessage") editor.windowManager.close();

        // message that requests to add content to tiny editor
        if (action === "addcontenttotinymessage") editor.insertContent(e.data.content);

        // message that requests the selected rollable table
        if (action === "selectedtablemessage") {
            const jqTable = $(editor.selection.getNode()).closest("table.compendium-left-aligned-table");
            const tableHtml = jqTable.length === 0 ? "" : jqTable[0].outerHTML;

            const dialogWindow = editor.windowManager.getWindows()[0];
            dialogWindow.getContentWindow().postMessage({ id: DDBX.id, action: "selectedtablemessage", tableHtml }, "*");
        }

        // message that requests to update a rollable table
        if (action === "updateselectedtablemessage") {
            const jqTable = $(editor.selection.getNode()).closest("table.compendium-left-aligned-table");
            if (jqTable.length > 0) {
                jqTable.replaceWith(e.data.content);
                editor.windowManager.close();
            }
        }
    });

    enableCloseByClickOut();
    loadBeTinyMCEPlugin();
})(DDBX);