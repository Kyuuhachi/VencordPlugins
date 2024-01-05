import definePlugin from "@utils/types";
import { Logger } from "@utils/Logger";
import TarFile from "./tar";

const logger = new Logger("98Tar", "#CAA698");

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

function getBuildNumber() {
    const initSentry = Vencord.Webpack.findByProps("initSentry").initSentry.toString();
    const [, buildNumber] = initSentry.match(/\.setTag\("buildNumber",\(\w+="(\d+)","\1"\)\)/);
    const [, builtAt] = initSentry.match(/\.setTag\("builtAt",String\("(\d+)"\)\)/);
    return { buildNumber, builtAt: Number(builtAt) };
}

async function protectWebpack(webpack, body) {
    let push = webpack.push.bind(webpack)
    let webpack_push = Object.getOwnPropertyDescriptor(webpack, "push");
    Object.defineProperty(webpack, "push", {
        get: () => push,
        set() { throw "nested webpack" },
        enumerable: true,
        configurable: true,
    });

    try {
        return await body();
    } finally {
        Object.defineProperty(webpack, "push", webpack_push);
    }
}

function getLoadedChunks(wreq) {
    let o = wreq.o;
    try {
        wreq.o = (a, b) => { throw a };
        wreq.f.j()
    } catch(e) {
        return e;
    } finally {
        wreq.o = o;
    }
}

function getChunkPaths(wreq) {
    const sym = Symbol("getChunkPaths");
    try {
        Object.defineProperty(Object.prototype, sym, {
            get() { throw this },
            set() { },
            configurable: true,
        });
        wreq.u(sym);
    } catch(e) {
        return e;
    } finally {
        delete Object.prototype[sym];
    }
}

async function forceLoadAll(wreq) {
    let chunks = getChunkPaths(wreq);
    let loaded = getLoadedChunks(wreq);
    const ids = Object.keys(chunks).filter(id => loaded[id] !== 0);
    let count = 0, errors = 0;
    await Promise.all(ids.map(async id => {
        try {
            await wreq.e(id);
        } catch(e) {
            logger.error(e);
            errors++;
        }
        count++;
        logger.log(`Loading webpack chunks... (${count}/${ids.length}${errors == 0 ? "" : `, ${errors} errors`})`)
    }));
}
