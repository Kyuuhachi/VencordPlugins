import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import { LazyComponent } from "@utils/lazyReact";
import definePlugin, { OptionType } from "@utils/types";
import { findComponentByCodeLazy } from "@webpack";
import { React } from "@webpack/common";

import "./style.css";

const TopBar = findComponentByCodeLazy('"TITLEBAR_FAST_TRAVEL"===') as any;

const Buttons = LazyComponent(() => React.memo(() => {
    const content = TopBar.$$vencordGetWrappedComponent().type();
    if (!content) return null; // it returns null if something is fullscreen
    const topbarData = content
        .props.children({}) // something with focus
        .props.children("") // a class name
        .props;
    return topbarData.trailing;
}));

export default definePlugin({
    name: "Untitled",
    description: "Removes the titlebar",
    authors: [Devs.Kyuuhachi],

    patches: [
        {
            find: '.initialTab){case"role_subscriptions":return ',
            replacement: {
                match: /"data-fullscreen":(\i),children:\[!\1&&/,
                replace: "$&false&&",
            },
        },
        {
            find: 'window.DiscordNative.remoteApp).getDefaultDoubleClickAction)?void 0:',
            replacement: {
                match: /\i\.Fragment\b/,
                replace: "$self.PatchButtons",
            },
        }
    ],

    PatchButtons({children}) {
        return <>
            {children}
            <ErrorBoundary>
                <Buttons />
            </ErrorBoundary>
        </>;
    }
});
