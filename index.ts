import Plugins, { PluginMeta } from "~plugins";

const PLUGINS = [
    require("./Anammox").default,
    require("./DeadMembers").default,
    require("./MessageLinkTooltip").default,
    require("./ModalFade").default,
    require("./MoreThemes").default,
    require("./NotificationTitle").default,
    require("./Onward").default,
    require("./TeX").default,
    require("./Title").default,
    require("./ViewRaw2").default,
    require("./WebpackTarball").default,
    require("./Classify").default,
    require("./Untitled").default,
];

for(const plugin of PLUGINS) {
    (plugin.tags ??= []).push("Kyuuhachi");
}

const name = Symbol("98VencordPlugins");
export default { name };

// This is called from api/Badges.ts, which is the first place that imports ~plugins
Set = new Proxy(Set, {
    construct(target, args) {
        if(Plugins && Plugins[name as any]) {
            Set = target;
            delete Plugins[name as any];
            const myMeta = PluginMeta[name as any];
            delete PluginMeta[name as any];
            for(const plugin of PLUGINS) {
                Plugins[plugin.name] = plugin;
                PluginMeta[plugin.name] = {
                    userPlugin: myMeta.userPlugin,
                    folderName: myMeta.folderName + "/" + plugin.name,
                };
            }
        }
        return Reflect.construct(target, args);
    }
});
