import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";

const TitleManager = findByPropsLazy("setPageTitleNotificationCount", "flashPageTitle");
const rootTitle = { base: null as string | null };

export const settings = definePluginSettings({
    title: {
        type: OptionType.STRING,
        default: "Vencord",
        description: "Window title prefix",
        onChange: setTitle,
    },
});

function setTitle(v: string) {
    rootTitle.base = v || null;
    TitleManager.flashPageTitle({ messages: 0 })();
}

export default definePlugin({
    name: "Title",
    description: "Replaces the window title prefix",
    authors: [{ id: 236588665420251137n, name: "Kyuuhachi" }],
    settings,

    patches: [
        {
            find: "setPageTitleNotificationCount:function()",
            replacement: {
                match: /\{base:\w+\.isPlatformEmbedded\?void 0:"Discord"\}/,
                replace: "$self.rootTitle",
            },
        },
    ],

    start() {
        setTitle(settings.store.title);
    },

    rootTitle,
});
