import definePlugin from "@utils/types";

import TarFile from "./tar";
import { forceLoadAll, getBuildNumber,protectWebpack } from "./webpack";

export default definePlugin({
    name: "98Tar",
    description: "Converts Discord's webpack sources into a tarball.",
    authors: [{ id: 236588665420251137n, name: "Kyuuhachi" }],

    toolboxActions: {
        async "Webpack Tarball"() {
            await saveTar();
        }
    },
});

async function saveTar() {
    await protectWebpack(webpackChunkdiscord_app, async () => {
        await forceLoadAll(Vencord.Webpack.wreq);
    });

    const tar = new TarFile();
    const { buildNumber, builtAt } = getBuildNumber();
    const mtime = (builtAt/1000)|0;
    // Can't use Vencord.Webpack here, since we're dealing with unevaluated sources.
    const modules = Object.assign({}, ...webpackChunkdiscord_app.map(a => a[1]));

    Object.entries(modules).forEach(([num, value]) => {
        value = value.__original || value;
        tar.addTextFile(
            `discord-${buildNumber}/${num}.js`,
            `webpack[${JSON.stringify(num)}] = ${value.toString()}\n`,
            { mtime },
        );
    });
    tar.save(`discord-${buildNumber}.tar`);
}
