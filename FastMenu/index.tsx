import { definePluginSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import { proxyLazy } from "@utils/lazy";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { ComponentDispatch, Forms, useEffect, useRef } from "@webpack/common";
import type { ComponentType, HTMLAttributes, PropsWithChildren, RefObject } from "react";

type FocusLock = ComponentType<PropsWithChildren<{
    containerRef: RefObject<HTMLElement>
}>>;

const { FocusLock } = proxyLazy(() => Forms as any as {
    FocusLock: FocusLock;
});

const cl = classNameFactory("");
const Classes = findByPropsLazy("animating", "baseLayer", "bg", "layer", "layers");

const settings = definePluginSettings({
    eagerLoad: {
        description: "Eagerly load menu contents (faster, but slightly more network load)",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: true,
    },
});

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
                    match: /createPromise:\(\)=>([^:}]*?),webpackId:"\d+",name:(?!="CollectiblesShop")"\w+"/g,
                    replace: "$&,_:$1",
                    predicate: () => settings.store.eagerLoad,
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
        },
        { // load menu stuff on hover, not on click
            find: "Messages.USER_SETTINGS_WITH_BUILD_OVERRIDE.format",
            replacement: {
                match: /(?<=handleOpenSettingsContextMenu.{0,250}?\i\.el\(("\d+")\)\.then.*?Messages\.USER_SETTINGS,)(?=onClick:)/,
                replace: "onMouseEnter(){let r=Vencord.Webpack.wreq;r.el($1).then(r.bind(r,$1));},"
            },
            predicate: () => settings.store.eagerLoad,
        },
    ],

    Layer({ mode, baseLayer = false, ...props }: {
        mode: "SHOWN" | "HIDDEN";
        baseLayer?: boolean;
    } & HTMLAttributes<HTMLDivElement>) {
        const hidden = mode === "HIDDEN";
        const containerRef = useRef<HTMLDivElement>(null);
        useEffect(() => () => {
            ComponentDispatch.dispatch("LAYER_POP_START");
            ComponentDispatch.dispatch("LAYER_POP_COMPLETE");
        }, []);
        const node = <div
            ref={containerRef}
            aria-hidden={hidden}
            className={cl({
                [Classes.layer]: true,
                [Classes.baseLayer]: baseLayer,
                "stop-animations": hidden,
            })}
            style={{ opacity: hidden ? 0 : undefined }}
            {...props}
        />;
        if(baseLayer) return node;
        else return <FocusLock containerRef={containerRef}>{node}</FocusLock>;
    },
});
