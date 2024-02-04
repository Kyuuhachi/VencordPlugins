/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy, wreq } from "@webpack";
import { Forms, useRef } from "@webpack/common";

const cl = classNameFactory("");
const Classes = findByPropsLazy("animating", "baseLayer", "bg", "layer", "layers");

const settings = definePluginSettings({
    eagerLoad: {
        description: "Eagerly load menu contents (faster, but slightly more network load)",
        type: OptionType.BOOLEAN,
        default: true,
        onChange(val) {
            if(val) eagerLoad();
        }
    },
});

const lazyLayers: any[] = [];
function eagerLoad() {
    lazyLayers.forEach((wreq as any).el);
}

export default definePlugin({
    name: "FastMenu",
    description: "Makes the settings menu open faster.",
    authors: [{ id: 236588665420251137n, name: "Kyuuhachi" }],
    settings,

    patches: [
        {
            find: "this.renderArtisanalHack()",
            replacement: [
                { // Fade in on layer
                    match: /(?<=(\w+)\.contextType=\w+\.AccessibilityPreferencesContext;)/,
                    replace: "$1=$self.Layer;",
                },
                { // Grab lazy-loaded layers
                    match: /webpackId:("\d+"),name:("\w+")/g,
                    replace: "$&,_:$self.lazyLayer($1,$2)",
                },
            ],
        },
        // For some reason standardSidebarView also has a small fade-in
        {
            find: "},DefaultCustomContentScroller:function(){return ",
            replacement: {
                match: /(?<=Fragment,\{children:)\w+\(\((\w+),\w+\)=>(\(0,\w+\.jsxs\))\(\w+\.animated\.div,\{style:\1,/,
                replace: "($2(\"div\",{"
            }
        }
    ],

    Layer({ mode, baseLayer = false, ...props }) {
        const hidden = mode === "HIDDEN";
        const containerRef = useRef<HTMLDivElement | null>(null);
        const node = <div
            ref={containerRef}
            aria-hidden={hidden}
            className={cl({
                [Classes.layer]: true,
                [Classes.baseLayer]: baseLayer,
                "stop-animations": hidden,
            })}
            style={{ visibility: hidden ? "hidden" : "visible" }}
            {...props}
        />;
        if(baseLayer) return node;
        else return <Forms.FocusLock containerRef={containerRef}>{node}</Forms.FocusLock>;
    },

    lazyLayer(moduleId, name) {
        if(name !== "CollectiblesShop")
            lazyLayers.push(moduleId);
    },

    start() {
        if(settings.store.eagerLoad)
            eagerLoad();
    },
});
