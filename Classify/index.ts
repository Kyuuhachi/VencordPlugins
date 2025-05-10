import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { StartAt } from "@utils/types";
import * as Webpack from "@webpack";

type Spec = {
    name: string;
    count?: number | null;
    include?: string[];
    exclude?: string[];
    exact?: boolean;
};

import _SPEC from "./spec.json";
const SPEC: Spec[] = _SPEC;

const logger = new Logger("Classify", "#CAA698");

const STYLE = document.createElement("style");
STYLE.id = "_98classify";

export default definePlugin({
    name: "Classify",
    description: "Adds css-friendly class names.",
    authors: [Devs.Kyuuhachi],

    patches: [
        {
            // Let's patch react itself. What's the worst that can happen?
            find: '.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot"',
            replacement: {
                match: /(?<=\i\(\i,"class",)\i(?=\);)/,
                replace: "$self.remap($&)",
            },
        },
    ],

    spec: SPEC,
    classes: {} as Record<string, string>,
    modules: [] as object[],

    startAt: StartAt.Init,
    start() {
        // The plugin won't work if it's enabled from the menu anyway so let's not register the listener
        if(!Webpack.wreq)
            Webpack.moduleListeners.add((module, id) => this.register(id, module));
    },

    register(id: string, module: object) {
        if(typeof module !== "object") return;
        const keys = Object.keys(module);
        if(keys.length == 0) return;
        for(const k of keys) {
            const v = module[k];
            if(typeof v !== "string") return;
            if(!v.startsWith(k.replaceAll("/", "-") + "_")) return;
        }

        this.modules.push(module);

        let prefix = this.spec.find(spec => this.checkSpec(module, spec))?.name;
        if(prefix === undefined) {
            const debugClass = `u${id}`;
            prefix = `u ${debugClass} ${debugClass}`;
            document.head.appendChild(STYLE);
            STYLE.innerHTML += `.${debugClass}.${debugClass}.${debugClass}.${debugClass} {}\n`;
        }
        for(const [k, v] of Object.entries(module)) {
            const v0 = v.split(" ")[0];
            this.classes[v0] = `${prefix}__${k} ${v0}`;
        }
    },

    remap(className: string) {
        return className.split(" ").map(c => this.classes[c] ?? c).join("\n");
    },

    checkSpec(module: object, spec: Spec) {
        for(const key of spec.include ?? []) {
            if(!Object.hasOwn(module, key)) return false;
        }
        for(const key of spec.exclude ?? []) {
            if(Object.hasOwn(module, key)) return false;
        }
        if(spec.exact && Object.keys(module).length !== spec.include!.length) return false;
        return true;
    },

    checkConsistency({ verbose = false } = {}) {
        for(const module of this.modules) {
            const matches = this.spec.filter(spec => this.checkSpec(module, spec));
            if(matches.length === 0 && verbose) logger.warn("no match for module", module);
            if(matches.length > 1) logger.warn("multiple matches for module", module, matches);
        }
        for(const spec of this.spec) {
            const matches = this.modules.filter(module => this.checkSpec(module, spec));
            const expected = spec.count === undefined ? 1 : spec.count;
            if(expected !== null) {
                if(matches.length < expected) logger.warn("too few matches for spec", spec, matches);
                if(matches.length > expected) logger.warn("too many matches for spec", spec, matches);
            }
        }
    },
});
