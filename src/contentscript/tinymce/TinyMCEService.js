import PageScriptService from "../../services/PageScriptService";

class TinyMCEService {
    /**
     * loads ddbx tinymce plugin on content page
     */
    static init() {
        PageScriptService.runFile("loadtinymceddbxplugin.js");
    }
}

export default TinyMCEService;