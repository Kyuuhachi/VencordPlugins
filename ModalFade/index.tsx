import { proxyLazy } from "@utils/lazy";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Forms, useEffect, useRef } from "@webpack/common";
import type { StoreApi, UseBoundStore } from "zustand";

type Modal = {
    Layer?: any,
    instant?: boolean,
    backdropStyle?: "SUBTLE" | "DARK" | "BLUR",
};

const { useModalContext, useModalsStore } = proxyLazy(() => Forms as any as {
    useModalContext(): "default" | "popout";
    useModalsStore: UseBoundStore<StoreApi<{
        default: Modal[];
        popout: Modal[];
    }>>,
});

const Spring = findByPropsLazy("a", "animated", "useTransition");
const AppLayer = findByPropsLazy("AppLayerContainer", "AppLayerProvider");

const ANIMS = {
    SUBTLE: {
        off: { opacity: 1 },
        on: { opacity: 0.9 },
    },
    DARK: {
        off: { opacity: 1 },
        on: { opacity: 0.7 },
    },
    BLUR: {
        off: { opacity: 1, filter: "blur(0px)" },
        on: { opacity: 0.7, filter: "blur(8px)" },
    },
};

export default definePlugin({
    name: "ModalFade",
    description: "Makes modals fade the backdrop, rather than dimming",
    authors: [{ id: 236588665420251137n, name: "Kyuuhachi" }],

    patches: [
        {
            find: "contextMenuCallbackNative,!1",
            replacement: {
                match: /(?<=children:\[\(0,\i\.jsx\)\()"div"(?=,\{className:\i\(\i\?)/,
                replace: "$self.MainWrapper",
            }
        },
        {
            find: "{})).SUBTLE=\"SUBTLE\"",
            replacement: {
                match: /\(0,\i\.useTransition\)*/,
                replace: "$self.nullTransition"
            }
        },
    ],

    nullTransition(value: any, args: object) {
        return Spring.useTransition(value, {
            ...args,
            from: {},
            enter: { _: 0 }, // Spring gets unhappy if there's zero animations
            leave: {},
        });
    },

    MainWrapper(props: object) {
        const context = useModalContext();
        const modals = useModalsStore(modals => modals[context] ?? []);
        const modal = modals.findLast(modal => modal.Layer == null || modal.Layer === AppLayer.default);
        const anim = ANIMS[modal?.backdropStyle ?? "DARK"];
        const isInstant = modal?.instant;
        const prevIsInstant = usePrevious(isInstant);
        const style = Spring.useSpring({
            config: { duration: isInstant || prevIsInstant ? 0 : 300 },
            ...modal != null ? anim.on : anim.off,
        });
        return <Spring.animated.div style={style} {...props} />;
    }
});

function usePrevious<T>(value: T | undefined): T | undefined {
    const ref = useRef<T>();
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
}
