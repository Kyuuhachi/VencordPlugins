import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    shiggy: {
        description: "Shiggy",
        type: OptionType.STRING,
        default: "https://media.discordapp.net/stickers/1039992459209490513.png",
        restartNeeded: true,
    }
});

export default definePlugin({
    name: "Shiggy",
    description: "Shiggy",
    authors: [{ id: 236588665420251137n, name: "Shiggy" }],
    settings,

    patches: [
        {
            find: "getGuildMemberAvatarURLSimple:function()",
            replacement: {
                match: /(?<=function (\i)\([^)]*\)\{)(?=.*(?!getAvatarDecorationURL\b)get\w+URL(?:Simple)?:\1\b)/g,
                replace: "$&return $self.settings.store.shiggy;"
            }
        },
    ],
});
