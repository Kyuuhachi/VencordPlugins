import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy, findStoreLazy } from "@webpack";
import { UserStore, SnowflakeUtils, GuildMemberStore } from "@webpack/common";
import { User, Channel } from "discord-types/general";
import { ComponentType } from "react"

const AuthorStore = findByPropsLazy("useNullableMessageAuthor", "useNullableMessageAuthor");
const ChannelMemberStore = findStoreLazy("ChannelMemberStore");

enum Mode {
    NICKNAME,
    STRIPPED,
    USERNAME,
    DISCORD_DATE,
    GUILD_DATE,
}

const settings = definePluginSettings({
    mode: {
        description: "Sort order to use",
        type: OptionType.SELECT,
        options: [
            { label: "Nickname", value: Mode.NICKNAME },
            { label: "Nickname (modified)", value: Mode.STRIPPED, default: true },
            { label: "Username", value: Mode.USERNAME },
            { label: "Discord join date", value: Mode.DISCORD_DATE },
            { label: "Guild join date", value: Mode.GUILD_DATE },
        ]
    },
    descending: {
        description: "Sort in descending order",
        default: false,
        type: OptionType.BOOLEAN,
    },
    groupChats: {
        description: "Also sort group chats",
        default: true,
        type: OptionType.BOOLEAN,
    },
});

export default definePlugin({
    name: "MemberSort",
    description: "Changes how the channel member list is sorted, by default ignoring prefixes like !",
    authors: [{ id: 236588665420251137n, name: "Kyuuhachi" }],
    settings,

    patches: [
        {
            find: "Messages.MEMBERS_LIST_LANDMARK_LABEL",
            replacement: [
                {
                    match: /(?<=render\(\){)(?=let\{groups:)/,
                    replace: "$self.guildList(this.props);",
                },
                {
                    match: /(?<=ListNavigatorProvider,\{navigator:\w+,children:\(0,\w+\.jsx\)\()\w+(?=,)/,
                    replace: "$self.wrapGuildList($&)",
                },
                {
                    match: /\|\|(\w+)\.groups\.length!==this\.\props\.groups.length/,
                    replace: "$&||$1._98_mode!=this.props._98_mode||$1._98_descending!=this.props._98_descending",
                },
            ],
        },
        {
            find: "Messages.MEMBER_LIST_PRIVATE_THREAD_INSTRUCTIONS",
            replacement: {
                match: /\(0,\w+\.useThreadMemberListSections\)\([^)]*\)/,
                replace: "$self.threadList(arguments[0], $&)",
            },
        },
        {
            find: ".getRecipients)(", // crappy string
            replacement: {
                // u=(0,i.useStateFromStoresArray)(
                //   [E.default],
                //   () => (0,x.getRecipients)(t.recipients,E.default),
                //   [t.recipients]
                // )
                match: /\(0,\w+\.useStateFromStoresArray\)\([^\]]*\][^\]]*?\.recipients\]\)/,
                replace: "$self.dmList(arguments[0], $&)",
            },
        },
    ],

    guildList(props: {
        channel: Channel,
        rows: { user: User }[];
        groups: { index: number; count: number }[];
    }) {
        let { mode, descending } = settings.store;
        props.rows = props.rows.slice();
        for(const group of props.groups) {
            sortRange(props.rows, group.index+1, group.count, compareBy(
                (row: {user: User}) => getSortKey(row.user, props.channel, mode),
                descending,
            ));
        }
    },

    wrapGuildList(Wrapped: ComponentType<any>) {
        return (props: object) => {
            let { mode, descending } = settings.use(["mode", "descending"]);
            return <Wrapped {...props} _98_mode={mode} _98_descending={descending} />;
        }
    },

    threadList(props: { channel: Channel }, groups: { userIds: string[] }[]) {
        let { mode, descending } = settings.use(["mode", "descending"]);
        return groups.map(group => ({
            ...group,
            userIds: group.userIds.toSorted(compareBy(
                (userId: string) => getSortKey(UserStore.getUser(userId), props.channel, mode),
                descending,
            )),
        }));
    },

    dmList(props: { channel: Channel }, users: User[]) {
        let { mode, descending, groupChats } = settings.use(["mode", "descending", "groupChats"]);
        if(groupChats) {
            return users.toSorted(compareBy(
                (user: User) => getSortKey(user, props.channel, mode),
                descending,
            ));
        } else {
            return users;
        }
    },
});

function sortRange<T>(
    array: T[],
    start: number,
    length: number,
    compareFn?: (a: T, b: T) => number,
) {
    new Proxy(array, {
        get(target, key: any) {
            if(key === "length") return length;
            if(isFinite(key)) return target[start + +key];
            return target[key];
        },
        set(target, key: any, value) {
            target[start + +key] = value;
            return true;
        }
    }).sort(compareFn);
}

function compareBy<T>(key: (v: T) => any, descending?: boolean): (a: T, b: T) => number {
    return (a: T, b: T) => {
        let a_ = key(a);
        let b_ = key(b);
        return (a_ > b_ ? 1 : a_ < b_ ? -1 : 0) * (descending ? -1 : 1);
    };
}

function getSortKey(user: User, channel: Channel, mode: Mode): any {
    let discordJoin = SnowflakeUtils.extractTimestamp(user.id);
    let member = GuildMemberStore.getMember(user.id, channel.guild_id);
    let nick = AuthorStore.getUserAuthor(user, channel).nick.toLowerCase();
    let username = [ user.username, user.discriminator ];
    switch(mode) {
        case Mode.NICKNAME: return [ nick, username ];
        case Mode.STRIPPED: return [ nick.replace(/^[\x20-\x2F]+/, ""), nick, username ];
        case Mode.USERNAME: return username;
        case Mode.DISCORD_DATE: return discordJoin;
        case Mode.GUILD_DATE: return [ member?.joinedAt, discordJoin ];
    }
}
