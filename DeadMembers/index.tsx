import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { classes } from "@utils/misc"

// TODO make this apply to forum post authors too.

export default definePlugin({
    name: "DeadMembers",
    description: "Shows when the sender of a message has left the guild",
    authors: [{ id: 236588665420251137n, name: "Kyuuhachi" }],

    patches: [
        {
            find: "UsernameDecorationTypes:function()",
            replacement: {
                match: /children:(\(\i\?"@":""\)\+\i)/,
                replace: "children:$self.wrap(arguments[0],$1)"
            }
        }
    ],

    wrap(props, text) {
        let dead = props.channel.guild_id != null
            && !Object.hasOwn(props.author, "guildMemberAvatar")
            && props.message.webhookId == null;
        return dead ? <s className="c98-author-dead">{text}</s> : text;
    }
});
