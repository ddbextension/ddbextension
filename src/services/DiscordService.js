import Configuration from "../data/Configuration";
import Opt from '../Options';

let discordUrl = null;
let discordEnabled = null;

class DiscordService {
    static init(config: Configuration) {
        discordEnabled = config[Opt.DiscordEnabled];
        discordUrl = config[Opt.DiscordUrl];
    }
    static postMessageToDiscord(message: string, username: string = 'DDBX', avatar_url: string = null) {

        const payload = JSON.stringify({
            content: message,
            username: username,
            avatar_url: avatar_url
        });
        const params = {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: payload
        };
        console.log(payload);
        if (discordEnabled === true && discordUrl) {
            fetch(discordUrl, params);
        }
    }
}

export default DiscordService;