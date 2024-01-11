import definePlugin from "@utils/types";

export default definePlugin({
    name: "ImageLink",
    description: "Suppresses the hiding of links for \"simple embeds\"",
    authors: [{ id: 236588665420251137n, name: "Kyuuhachi" }],

    patches: [
        {
            find: "isEmbedInline:function",
            replacement: {
                match: /(?<=isEmbedInline:function\(\)\{return )\w+(?=\})/,
                replace: "()=>false",
            },
        },
    ],
});
