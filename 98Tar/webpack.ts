export async function protectWebpack(webpack, body) {
    const push = webpack.push.bind(webpack);
    const webpack_push = Object.getOwnPropertyDescriptor(webpack, "push");
    Object.defineProperty(webpack, "push", {
        get: () => push,
        set() { throw "nested webpack"; },
        enumerable: true,
        configurable: true,
    });

    try {
        return await body();
    } finally {
        Object.defineProperty(webpack, "push", webpack_push);
    }
}

export function getLoadedChunks(wreq) {
    const { o } = wreq;
    try {
        wreq.o = a => { throw a; };
        wreq.f.j();
    } catch(e) {
        return e;
    } finally {
        wreq.o = o;
    }
}

export function getChunkPaths(wreq) {
    const sym = Symbol("getChunkPaths");
    try {
        Object.defineProperty(Object.prototype, sym, {
            get() { throw this; },
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

export async function forceLoadAll(wreq, on_chunk = ()=>{}) {
    const chunks = getChunkPaths(wreq);
    const loaded = getLoadedChunks(wreq);
    const ids = Object.keys(chunks).filter(id => loaded[id] !== 0);
    await Promise.all(ids.map(async id => {
        try {
            await wreq.e(id);
        } catch {}
        on_chunk(id);
    }));
}
