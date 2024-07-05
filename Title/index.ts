import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findByCodeLazy, findByPropsLazy } from "@webpack";

const flashPageTitle = findByCodeLazy("=>({flashQueue:[...");
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
    flashPageTitle({ messages: 0 })();
}

export default definePlugin({
    name: "Title",
    description: "Replaces the window title prefix",
    authors: [Devs.Kyuuhachi],
    settings,

    patches: [
        {
            find: 'isPlatformEmbedded?void 0:"Discord"',
            replacement: {
                match: /\{base:\i\("?\d+?"?\)\.isPlatformEmbedded\?void 0:"Discord"\}/,
                replace: "$self.rootTitle",
            },
        },
    ],

    start() {
        setTitle(settings.store.title);
    },

    rootTitle,
});
