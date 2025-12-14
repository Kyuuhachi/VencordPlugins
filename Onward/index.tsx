import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "Onward",
    description: "Improves the forward selection menu",
    authors: [Devs.Kyuuhachi],

    patches: [
        {
            find: ".DM?{type:\"user\",id:",
            replacement: {
                match: /\?\[\]:\[\i\.id\];/,
                replace: "?[]:[];"
            },
        },
    ],
});

