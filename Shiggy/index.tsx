import definePlugin from "@utils/types";

export default definePlugin({
    name: "Shiggy",
    description: "Shiggy",
    authors: [{ id: 236588665420251137n, name: "Shiggy" }],
    shiggy: "https://media.discordapp.net/stickers/1039992459209490513.png",

    patches: [
        {
            find: "getGuildMemberAvatarURLSimple:function()",
            replacement: {
                match: /(?<=function (\i)\([^)]*\)\{)(?=.*get\w+URL(?:Simple)?:\1\b)/g,
                replace: "$&return $self.shiggy;"
            }
        },
    ],
});
