import type { WebpackInstance } from "discord-types/other";

export async function protectWebpack<T>(webpack: any[], body: () => Promise<T>): Promise<T> {
    const prev_m = Object.getOwnPropertyDescriptor(Function.prototype, "m")!;
    Object.defineProperty(Function.prototype, "m", {
        get() { throw "get require.m"; },
        set() { throw "set require.m"; },
        enumerable: true,
        configurable: true,
    });

    try {
        return await body();
    } finally {
        Object.defineProperty(Function.prototype, "m", prev_m);
    }
}

export function getLoadedChunks(wreq: WebpackInstance): { [chunkId: string | symbol]: 0 | undefined } {
    const { o } = wreq;
    try {
        wreq.o = (a: any) => { throw a; };
        wreq.f.j();
    } catch(e: any) {
        return e;
    } finally {
        wreq.o = o;
    }
    throw new Error("getLoadedChunks failed");
}

export function getChunkPaths(wreq: WebpackInstance): { [chunkId: string]: string } {
    const sym = Symbol("getChunkPaths");
    try {
        Object.defineProperty(Object.prototype, sym, {
            get() { throw this; },
            set() { },
            configurable: true,
        });
        wreq.u(sym);
    } catch(e: any) {
        return e;
    } finally {
        // @ts-ignore
        delete Object.prototype[sym];
    }
    throw new Error("getChunkPaths failed");
}

export async function forceLoadAll(wreq: WebpackInstance, on_chunk: (id: string) => void = () => {}) {
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
