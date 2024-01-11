import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { i18n } from "@webpack/common";

export const settings = definePluginSettings({
    dms: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Remove shops above DMs list",
        restartNeeded: true,
    },
    gift: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Remove gift button",
        restartNeeded: true,
    },
});

export default definePlugin({
    name: "Anammox",
    description: "A microbial process that plays an important part in the nitrogen cycle",
    authors: [{ id: 236588665420251137n, name: "Kyuuhachi" }],
    settings,

    patches: [
        // Above DMs, mouse nav
        {
            find: 'tutorialId:"direct-messages"',
            replacement: {
                match: /"premium"\)/,
                replace: "$&&&undefined",
            },
            predicate: () => settings.store.dms,
        },
        {
            find: 'tutorialId:"direct-messages"',
            replacement: {
                match: /"discord-shop"\)/,
                replace: "$&&&undefined",
            },
            predicate: () => settings.store.dms,
        },
        // Above DMs, keyboard nav
        {
            find: ".default.hasLibraryApplication()&&!",
            replacement: {
                match: /Routes\.APPLICATION_STORE,/,
                replace: "undefined,",
            },
            predicate: () => settings.store.dms,
        },
        {
            find: ".default.hasLibraryApplication()&&!",
            replacement: {
                match: /Routes\.COLLECTIBLES_SHOP,/,
                replace: "undefined,",
            },
            predicate: () => settings.store.dms,
        },
        {
            find: 'Messages.PREMIUM_GIFT_BUTTON_LABEL,"aria-haspopup":"dialog",onClick:',
            replacement: {
                match: /if\(\w+\)return null;/,
                replace: "return null;",
            },
            predicate: () => settings.store.gift,
        },
    ],
});
