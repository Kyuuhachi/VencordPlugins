import Plugins from "~plugins";

const PLUGINS = [
    require("./Anammox").default,
    require("./ColorMessage").default,
    require("./DeadMembers").default,
    require("./MessageLinkTooltip").default,
    require("./ModalFade").default,
    require("./TeX").default,
    require("./Title").default,
    require("./WebpackTarball").default,
    require("./Classify").default,
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
            for(const plugin of PLUGINS)
                Plugins[plugin.name] = plugin;
        }
        return Reflect.construct(target, args);
    }
});
