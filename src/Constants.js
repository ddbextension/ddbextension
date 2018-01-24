const configurationId = "ddbx-config";

const closeTinyMessage = "closetinymessage";
const addContentToTinyMessage = "addcontenttotinymessage";
const getSelectedTableTinyMessage = "selectedtablemessage";
const updateSelectedTableTinyMessage = "updateselectedtablemessage";
const rowLoadedMessage = "rowloadedmessage";
const usernameMessage = "usernamemessage";
const tooltipErrorMessage = "tooltiperrormessage";
const commentChangedMessage = "commentchangedmessage";
const buildTooltipMessage = "buildtooltipmessage";

class Constants {
    static get ConfigurationId() {
        return configurationId;
    }

    static get CloseTinyMessage() {
        return closeTinyMessage;
    }
    static get AddContentToTinyMessage() {
        return addContentToTinyMessage;
    }
    static get GetSelectedTableTinyMessage() {
        return getSelectedTableTinyMessage;
    }
    static get UpdateSelectedTableTinyMessage() {
        return updateSelectedTableTinyMessage;
    }
    static get RowLoadedMessage() {
        return rowLoadedMessage;
    }
    static get UsernameMessage() {
        return usernameMessage;
    }
    static get TooltipErrorMessage() {
        return tooltipErrorMessage;
    }
    static get CommentChangedMessage() {
        return commentChangedMessage;
    }
    static get BuildTooltipMessage() {
        return buildTooltipMessage;
    }
}

export default Constants;