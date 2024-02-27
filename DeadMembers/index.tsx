import definePlugin from "@utils/types";

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
        },
        {
            find: "Messages.FORUM_POST_AUTHOR_A11Y_LABEL",
            replacement: {
                match: /(?<=\}=(\i),\{(user:\i,author:\i)\}=.{0,400}?\(\i\.Fragment,{children:)\i(?=}\),)/,
                replace: "$self.wrap({...$1,$2},$&)"
            }
        },
    ],

    wrap(props, text) {
        const dead = props.channel.guild_id != null
            && !Object.hasOwn(props.author, "guildMemberAvatar")
            && props.message?.webhookId == null;
        return dead ? <s className="c98-author-dead">{text}</s> : text;
    }
});
