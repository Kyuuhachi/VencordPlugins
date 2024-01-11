import { definePluginSettings } from "@api/Settings";
import { closeModal, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot, openModal } from "@utils/modal";
import definePlugin, { OptionType } from "@utils/types";
import { findByProps,wreq } from "@webpack";
import { Button, Flex, Forms, moment, Timestamp, useState } from "@webpack/common";

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
                    rootProps={props}
                    close={() => closeModal(key)}
                />
            ));
        }
    },
});

export function getBuildNumber() {
    const initSentry = findByProps("initSentry").initSentry.toString();
    const [, buildNumber] = initSentry.match(/\.setTag\("buildNumber",\(\w+="(\d+)","\1"\)\)/);
    const [, builtAt] = initSentry.match(/\.setTag\("builtAt",String\("(\d+)"\)\)/);
    return { buildNumber, builtAt: Number(builtAt) };
}

function saveTar(usePatched: bool) {
    const tar = new TarFile();
    const { buildNumber, builtAt } = getBuildNumber();
    const mtime = (builtAt/1000)|0;
    const modules = Object.assign({}, ...webpackChunkdiscord_app.map(a => a[1]));

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

function TarModal({ rootProps, close }) {
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
        <ModalRoot {...rootProps}>
            <ModalHeader>
                <Flex.Child>
                    <Forms.Heading variant="heading-lg/semibold">
                        Webpack Tarball
                    </Forms.Heading>
                    <Forms.Text variant="text-md/normal">
                        <Timestamp timestamp={moment(builtAt)} isInline={false}>
                            {"Build number "}
                            {buildNumber}
                        </Timestamp>
                    </Forms.Text>
                </Flex.Child>
                <ModalCloseButton onClick={close} />
            </ModalHeader>

            <ModalContent>
                <div style={{ marginTop: "8px", marginBottom: "24px" }}>
                    <Forms.FormTitle>
                        Lazy chunks
                    </Forms.FormTitle>
                    <Flex align={Flex.Align.CENTER}>
                        <Forms.Text
                            variant="text-md/normal"
                            style={{ flexGrow: 1 }}
                        >
                            {loaded}/{all}
                            {errored ? ` (${errored} errors)` : null}
                        </Forms.Text>
                        <Button
                            disabled={loading === all || isLoading}
                            onClick={async () => {
                                setLoading(true);
                                await Webpack.protectWebpack(webpackChunkdiscord_app, async () => {
                                    await Webpack.forceLoadAll(wreq, rerender);
                                });
                            }}
                        >
                            {loaded === all ? "Loaded" : loading === all ? "Loading" : "Load all"}
                        </Button>
                    </Flex>
                </div>

                <Forms.FormSwitch
                    value={settings.use(["usePatched"]).usePatched}
                    onChange={v => settings.store.usePatched = v}
                    hideBorder
                >
                    {settings.def.usePatched.description}
                </Forms.FormSwitch>
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
