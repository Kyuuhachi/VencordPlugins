import { definePluginSettings } from "@api/Settings";
import { makeLazy } from "@utils/lazy";
import { closeModal, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalProps, ModalRoot, openModal } from "@utils/modal";
import definePlugin, { OptionType } from "@utils/types";
import { findByProps, wreq } from "@webpack";
import { Button, Flex, Forms, Switch, Text, Timestamp, useState } from "@webpack/common";

import TarFile from "./tar";
import * as Webpack from "./webpack";

export const settings = definePluginSettings({
    patched: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Include patched modules",
        restartNeeded: true,
    },
    original: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Include original modules",
        restartNeeded: true,
    },
});

export default definePlugin({
    name: "WebpackTarball",
    description: "Converts Discord's webpack sources into a tarball.",
    authors: [{ id: 236588665420251137n, name: "Kyuuhachi" }],
    settings,

    toolboxActions: {
        "Webpack Tarball"() {
            const key = openModal(props => (
                <TarModal
                    modalProps={props}
                    close={() => closeModal(key)}
                />
            ));
        }
    },
});

export const getBuildNumber = makeLazy(() => {
    try {
        const initSentry = findByProps("initSentry").initSentry.toString();
        const [, buildNumber] = initSentry.match(/\.setTag\("buildNumber",\(\w+="(\d+)","\1"\)\)/);
        const [, builtAt] = initSentry.match(/\.setTag\("builtAt",String\("(\d+)"\)\)/);
        return { buildNumber, builtAt: new Date(Number(builtAt)) };
    } catch(e) {
        console.error(e);
        return { buildNumber: "unknown", builtAt: new Date() };
    }
});

function saveTar(patched: boolean, vanilla: boolean) {
    const tar = new TarFile();
    const { buildNumber, builtAt } = getBuildNumber();
    const mtime = (builtAt.getTime() / 1000)|0;
    const webpack = window.webpackChunkdiscord_app as any[];
    const modules: { [id: string]: any } = Object.assign({}, ...webpack.map(a => a[1]));

    const root = patched ? `vencord-${buildNumber}` : `discord-${buildNumber}`;

    Object.entries(modules).forEach(([id, module]) => {
        if(patched && vanilla && module.original) {
            tar.addTextFile(
                `${root}/${id}.orig.js`,
                `webpack[${JSON.stringify(id)}] = ${module.original.toString()}\n`,
                { mtime },
            );
        }
        module = patched ? module : (module.original ?? module);
        tar.addTextFile(
            `${root}/${id}.js`,
            `webpack[${JSON.stringify(id)}] = ${module.toString()}\n`,
            { mtime },
        );
    });
    tar.save(`${root}.tar`);
}

function TarModal({ modalProps, close }: { modalProps: ModalProps; close(): void; }) {
    const { buildNumber, builtAt } = getBuildNumber();
    const [, rerender] = useState({});
    const [isLoading, setLoading] = useState(false);
    const paths = Webpack.getChunkPaths(wreq);
    const status = Object.entries(Webpack.getLoadedChunks(wreq))
        .filter(([k]) => wreq.o(paths, k))
        .map(([, v]) => v);
    const loading = status.length;
    const loaded = status.filter(v => v === 0 || v === undefined).length;
    const errored = status.filter(v => v === undefined).length;
    const all = Object.keys(paths).length;
    const { patched, original } = settings.use(["patched", "original"]);
    return (
        <ModalRoot {...modalProps}>
            <ModalHeader>
                <Flex.Child>
                    <Forms.FormTitle tag="h2">
                        Webpack Tarball
                    </Forms.FormTitle>
                    <Text variant="text-md/normal">
                        <Timestamp timestamp={new Date(builtAt)} isInline={false}>
                            {"Build number "}
                            {buildNumber}
                        </Timestamp>
                    </Text>
                </Flex.Child>
                <ModalCloseButton onClick={close} />
            </ModalHeader>

            <ModalContent>
                <div style={{ marginTop: "8px", marginBottom: "24px" }}>
                    <Forms.FormTitle>
                        Lazy chunks
                    </Forms.FormTitle>
                    <Flex align={Flex.Align.CENTER}>
                        <Text
                            variant="text-md/normal"
                            style={{ flexGrow: 1 }}
                        >
                            {loaded}/{all}
                            {errored ? ` (${errored} errors)` : null}
                        </Text>
                        <Button
                            disabled={loading === all || isLoading}
                            onClick={async () => {
                                setLoading(true);
                                await Webpack.protectWebpack(window.webpackChunkdiscord_app as any[], async () => {
                                    await Webpack.forceLoadAll(wreq, rerender);
                                });
                            }}
                        >
                            {loaded === all ? "Loaded" : loading === all ? "Loading" : "Load all"}
                        </Button>
                    </Flex>
                </div>

                <Switch
                    value={patched}
                    onChange={v => settings.store.patched = v}
                    hideBorder
                >
                    {settings.def.patched.description}
                </Switch>

                <Switch
                    value={original}
                    onChange={v => settings.store.original = v}
                    hideBorder
                >
                    {settings.def.original.description}
                </Switch>
            </ModalContent>

            <ModalFooter>
                <Button
                    disabled={!patched && !original}
                    onClick={() => {
                        saveTar(patched, original);
                        close();
                    }}
                >
                    Create
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}
