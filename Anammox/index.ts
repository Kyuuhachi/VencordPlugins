import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

export const settings = definePluginSettings({
    dms: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Remove shops above DMs list",
        restartNeeded: true,
    },
    quests: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Remove quests above DMs list",
        restartNeeded: true,
    },
    serverBoost: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Remove server boost info above channel list",
        restartNeeded: true,
    },
    billing: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Remove billing settings",
        restartNeeded: true,
    },
    gift: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Remove gift button",
        restartNeeded: true,
    },
    gif: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Remove gif and sticker buttons",
        restartNeeded: true,
    },
    emojiList: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Remove unavailable categories from the emoji picker",
        restartNeeded: true,
    },
    settings: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Remove nitro-only settings in profile and appearance sections",
        restartNeeded: true,
    },
});

export default definePlugin({
    name: "Anammox",
    description: "A microbial process that plays an important part in the nitrogen cycle",
    authors: [Devs.Kyuuhachi],
    settings,

    patches: [
        { // Above DMs, mouse nav
            find: 'tutorialId:"direct-messages"',
            replacement: [
                {
                    match: /"nitro-tab-group"\)/,
                    replace: "$&&&undefined",
                },
                {
                    match: /"discord-shop"\)/,
                    replace: "$&&&undefined",
                },
            ],
            predicate: () => settings.store.dms,
        },
        { // Above DMs, keyboard nav
            find: ".hasLibraryApplication()&&!",
            replacement: [
                {
                    match: /\i\.\i\.APPLICATION_STORE,/,
                    replace: "/*$&*/",
                },
                {
                    match: /\i\.\i\.COLLECTIBLES_SHOP,/,
                    replace: "/*$&*/",
                },
            ],
            predicate: () => settings.store.dms,
        },
        { // Above DMs, mouse nav (for quests)
            find: 'tutorialId:"direct-messages"',
            replacement: {
                match: /"quests"\)/,
                replace: "$&&&undefined",
            },
            predicate: () => settings.store.quests,
        },
        { // Above DMs, keyboard nav (for quests)
            find: ".hasLibraryApplication()&&!",
            replacement: {
                match: /,\i\.\i\.QUEST_HOME_V2/,
                replace: "",
            },
            predicate: () => settings.store.quests,
        },
        { // Channel list server boost progress bar
            find: "useGuildActionRow",
            replacement: {
                match: /\i\.premiumProgressBarEnabled&&[^,]+/,
                replace: "null"
            },
            predicate: () => settings.store.serverBoost,
        },
        { // Settings, sidebar
            find: 'header:"Developer Only"',
            replacement: [
                {
                    match: /header:[^,]+#{intl::BILLING_SETTINGS}\)/,
                    replace: "capitalism:true"
                },
                {
                    match: /\i\?\i:\i\.toSpliced\(3,0,\i\)/,
                    replace: "($&).filter(e=>!e.capitalism)",
                },
            ],
            predicate: () => settings.store.billing,
        },
        { // Gift button
            find: '"sticker")',
            replacement: { match: /&&\i\.push\({[^&]*?,"gift"\)}\)/, replace: "", },
            predicate: () => settings.store.gift,
        },
        { // Gif and sticker buttons
            find: '"sticker")',
            replacement: [
                { match: /&&\i\.push\({[^&]*?,"gif"\)}\)/, replace: "", },
                { match: /&&\i\.push\({[^&]*?,"sticker"\)}\)/, replace: "", },
            ],
            predicate: () => settings.store.gif,
        },
        { // Emoji list
            find: "#{intl::EMOJI_PICKER_CREATE_EMOJI_TITLE}),size:",
            replacement: {
                match: /(\i)=\i\|\|!\i&&\i.\i.isEmojiCategoryNitroLocked\(\{[^}]*\}\);/,
                replace: "$&$1||"
            },
            predicate: () => settings.store.emojiList,
        },
        { // Emoji category list
            find: "#{intl::EMOJI_CATEGORY_TOP_GUILD_EMOJI},{guildName:",
            replacement: {
                match: /(?<=(\i)\.unshift\((\i)\):)(?=\1\.push\(\2\))/,
                replace: "$2.isNitroLocked||"
            },
            predicate: () => settings.store.emojiList,
        },
        { // Appareance settings
            find: "children:this.renderTimestampHourCycle()",
            replacement: {
                match: /\(\i\.\i,\{setting:\i\.\i\.APPEARANCE_ICON,children:\(0,\i\.jsx\)\(\i\.\i,\{\}\)\}\)/,
                replace: "$&&&false",
            },
            predicate: () => settings.store.settings,
        },
        { // Appearance settings, theme section
            find: ".useSetting().customUserThemeSettings;return",
            replacement: {
                // Default themes, dark sidebar, try it out, color themes. Keep the first two.
                // There's a leftover divider but who give a dam
                match: /\[(\(0,\i.jsx\)\(\i\.\i\.Basic,\{className:\i\.basicThemeSelectors\}\),\(0,\i.jsx\)\(\i,\{\}\)),\(0,\i\.jsx\)\(\i\.\i,\{\}\),\i\]/,
                replace: "[$1]",
            },
            predicate: () => settings.store.settings,
        },
        { // Profile customization
            find: "UserSettingsProfileCustomization: user cannot be undefined",
            replacement: [
                { // "Go to shop" button. Don't like this match, it's fragile and risks deleting the wrong thing
                    match: /children:\[/,
                    replace: "$&false&&",
                },
                { // shouldShow = !canUsePremiumProfileCustomization. Hides the "Nitro preview" and "Try it out".
                    match: /(\i)=!\i,/,
                    replace: "$1=false,",
                },
            ],
            predicate: () => settings.store.settings,
        },
        { // Profile customization for guild
            find: ".nitroWheel})})]}),showRemoveAvatarButton:",
            replacement: {
                match: /\(0,\i\.jsxs\)\(\i\.\i,\{user:\i,showOverlay:!\i,/,
                replace: "false&&$&",
            },
            predicate: () => settings.store.settings,
        },
    ],
});
