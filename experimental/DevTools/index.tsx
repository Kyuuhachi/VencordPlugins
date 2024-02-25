import definePlugin from "@utils/types";
import ErrorBoundary from "@components/ErrorBoundary";

import PluginsTool from "./PluginsTool";

export default definePlugin({
    name: "DevTools",
    description: "Adds tabs to the devtools in the top-right bug menu",
    authors: [{ id: 236588665420251137n, name: "Kyuuhachi" }],

    patches: [
        {
            find: 'push({id:"design_toggles",name:"Design Toggles",render:()=>',
            replacement: {
                match: /(?<=,\{\}\)\}\)\),)\i(?=\},\[\]\),\{TabBar:)/,
                replace: "$self.addTabs($&)"
            }
        }
    ],

    addTabs(tabs) {
        tabs.splice(0, 0, {
            id: "vc-plugins",
            name: "Plugins",
            render: () => <ErrorBoundary><PluginsTool /></ErrorBoundary>,
        });
        return tabs;
    }
});

