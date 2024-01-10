import Plugins from "~plugins";

const PLUGINS = [
    require("./98Anammox").default,
    require("./98Classify").default,
    require("./98ColorName").default,
    require("./98HistoryModal").default,
    require("./98ImageLink").default,
    require("./98Tar").default,
    require("./ReplyTimestamp").default,
];

const name = Symbol("98VencordPlugins");
export default { name };

// This is called from api/Badges.ts, which is the first place that imports ~plugins
Set = new Proxy(Set, {
    construct(target, args) {
        if(Plugins && Plugins[name]) {
            Set = target;
            delete Plugins[name];
            for(const plugin of PLUGINS)
                Plugins[plugin.name] = plugin;
        }
        return Reflect.construct(target, args);
    }
});
