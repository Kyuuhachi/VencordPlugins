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
            replacement: [
                {
                    match: /(\i)=>\{/,
                    replace: "$&let _props1=$1,_props2;"
                },
                {
                    match: /\(0,\i\.useForumPostAuthor\)/,
                    replace: "_props2=$&"
                },
                {
                    match: /children:(\i)/,
                    replace: "children:$self.wrap({..._props1,..._props2},$1)"
                },
            ]
        },
    ],

    wrap(props, text) {
        const dead = props.channel.guild_id != null
            && !Object.hasOwn(props.author, "guildMemberAvatar")
            && props.message.webhookId == null;
        return dead ? <s className="c98-author-dead">{text}</s> : text;
    }
});
