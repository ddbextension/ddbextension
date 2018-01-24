import C from "../../Constants";

/**
 * Class that handles storage data ids prefixes.
 */
class Prefix {
    static createStorageId(dataClass: string, increment: number) {
        if (dataClass === "Configuration") return C.ConfigurationId;
        if (!increment) {
            increment = 0;
        }
        return "be-" + (new Date().getTime() + increment);
    }
}

export default Prefix;