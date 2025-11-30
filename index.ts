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

// This is the earliest possible interception point
// Found by setting a breakpoint here and stepping forward until it reaches something I can intercept
const old = document.addEventListener;
document.addEventListener = new Proxy(document.addEventListener, {
    apply(target, thisArg, args) {
        if(Plugins && Plugins[name as any]) {
            target.addEventListener = old;
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
        return Reflect.apply(target.addEventListener, thisArg, args);
    }
});
