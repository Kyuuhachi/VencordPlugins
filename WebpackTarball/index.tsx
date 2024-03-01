import { definePluginSettings } from "@api/Settings";
import { makeLazy } from "@utils/lazy";
import { closeModal, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalProps, ModalRoot, openModal } from "@utils/modal";
import definePlugin, { OptionType } from "@utils/types";
import { findByProps, wreq } from "@webpack";
import { Button, Flex, Forms, Switch, Text, Timestamp, useState } from "@webpack/common";

import TarFile from "./tar";
import * as Webpack from "./webpack";

export const settings = definePluginSettings({
    usePatched: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Include Vencord patches",
        restartNeeded: true,
    },
});

export default definePlugin({
    name: "WebpackTarball",
    description: "Converts Discord's webpack sources into a tarball.",
    authors: [{ id: 236588665420251137n, name: "Kyuuhachi" }],
    settings,

    toolboxActions: {
        async "Webpack Tarball"() {
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

function saveTar(usePatched: boolean) {
    const tar = new TarFile();
    const { buildNumber, builtAt } = getBuildNumber();
    const mtime = (builtAt.getTime() / 1000)|0;
    const webpack = window.webpackChunkdiscord_app as any[];
    const modules: { [id: string]: any } = Object.assign({}, ...webpack.map(a => a[1]));

    const root = usePatched ? `vencord-${buildNumber}` : `discord-${buildNumber}`;

    Object.entries(modules).forEach(([id, module]) => {
        module = usePatched ? module : (module.original ?? module);
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
                    value={settings.use(["usePatched"]).usePatched}
                    onChange={(v: boolean) => settings.store.usePatched = v}
                    hideBorder
                >
                    {settings.def.usePatched.description}
                </Switch>
            </ModalContent>

            <ModalFooter>
                <Button
                    onClick={() => {
                        saveTar(settings.store.usePatched);
                        close();
                    }}
                >
                    Create
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}
