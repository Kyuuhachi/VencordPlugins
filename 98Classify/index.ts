import definePlugin from "@utils/types";
import { Logger } from "@utils/Logger";

import SPEC from "./spec";

const logger = new Logger("98Classify", "#CAA698");

const STYLE = document.createElement("style");
STYLE.id = "_98classify";

export default definePlugin({
    name: "98Classify",
    description: "Adds css-friendly class names.",
    authors: [{ id: 236588665420251137n, name: "Kyuuhachi" }],

    patches: [
        {
            // This 'e' is kinda awkward, but I haven't seen anything it fails to catch yet
            // It does catch a few false positives though.
            find: '"use strict";e.exports={',
            all: true,
            replacement: {
                match: /\}\}$/,
                replace: '};$self.register(e.exports)}',
            },
            noWarn: true,
        },
        {
            // Let's patch react itself. What's the worst that can happen?
            find: ",this.attributeNamespace=",
            replacement: {
                match: /,(\w+\?\w+\.setAttributeNS\((\w+),(\w+),(\w+)\):)/,
                replace: ',(!$2&&$3==="class"&&($4=$self.remap($4))),$1',
            },
        },
    ],

    spec: SPEC,
    classes: {},
    modules: [],

    register(module) {
        if(!Object.entries(module)
            .every(([k, v]) => typeof v == "string" && v.startsWith(k.replaceAll("/", "-") + "_"))
        ) {
            logger.debug("skipping", module);
            return;
        }

        this.modules.push(module);

        let prefix = this.spec.find(spec => this.checkSpec(module, spec))?.name;
        if(prefix === undefined) {
            let debugClass = `u${this.modules.length}`;
            prefix = `u ${debugClass} ${debugClass}`;
            document.head.appendChild(STYLE);
            STYLE.innerHTML += `.${debugClass}.${debugClass}.${debugClass}.${debugClass} {}\n`;
        }
        for(let [k, v] of Object.entries(module)) {
            v = v.split(" ")[0];
            this.classes[v] = `${prefix}__${k} ${v}`
        }
    },

    remap(className) {
        return className.split(" ").map(c => this.classes[c] ?? c).join("\n");
    },

    checkSpec(module, spec) {
        let exact = false;
        for(const key of spec.include ?? []) {
            if(!Object.hasOwn(module, key)) return false;
        }
        for(const key of spec.exclude ?? []) {
            if(Object.hasOwn(module, key)) return false;
        }
        if(spec.exact && Object.keys(module).length != spec.include.length) return false;
        return true;
    },

    checkConsistency({verbose = false} = {}) {
        for(const module of this.modules) {
            let matches = this.spec.filter(spec => this.checkSpec(module, spec));
            if(matches.length == 0 && verbose) logger.warn("no match for module", module);
            if(matches.length > 1) logger.warn("multiple matches for module", module, matches);
        }
        for(const spec of this.spec) {
            let matches = this.modules.filter(module => this.checkSpec(module, spec));
            let expected = spec.count === undefined ? 1 : spec.count;
            if(expected !== null) {
                if(matches.length < expected) logger.warn("too few matches for spec", spec, matches);
                if(matches.length > expected) logger.warn("too many matches for spec", spec, matches);
            }
        }
    },
});
