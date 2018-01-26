import Configuration from "../data/Configuration";
import Opt from '../Options';

let discordUrl = null;
let discordEnabled = null;

class DiscordService {
    static init(config: Configuration) {
        discordEnabled = config[Opt.DiscordEnabled];
        discordUrl = config[Opt.DiscordUrl];
    }
    static postMessageToDiscord(message: string) {
        if (discordEnabled === true && discordUrl) {
            const payload = JSON.stringify({
                content: message
            });
            const params = {
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: payload
            };
            console.log(message);
            // fetch(discordUrl, params);
        }
    }
}

export default DiscordService;