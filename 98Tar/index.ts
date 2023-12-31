import definePlugin from "@utils/types";

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
    // Load all chunks, hopefully
    await Promise.all(Array(100).fill().map((_, i) =>
        Vencord.Webpack.wreq.e(i).catch(() => {})
    ));

    const tar = new TarFile();
    const buildNumber = getBuildNumber();
    // Can't use Vencord.Webpack here, since we're dealing with unevaluated sources.
    const modules = Object.assign({}, ...webpackChunkdiscord_app.map(a => a[1]));

    Object.entries(modules).forEach(([num, value]) => {
        value = value.__original || value;
        tar.addTextFile(
            `discord-${buildNumber}/${num}.js`,
            `webpack[${JSON.stringify(num)}] = ${value.toString()}`
        );
    });
    tar.save(`discord-${buildNumber}.tar`);
}

function getBuildNumber() {
    return Vencord.Webpack.findByProps("analyticsTrackingStoreMaker", "getCampaignParams")
        .default.getSuperProperties().client_build_number;
}

class TarFile {
    constructor() {
        this.buffers = [];
    }

    addTextFile(name, text) {
        this.addFile(name, new TextEncoder().encode(text));
    }

    addFile(name, data) {
        this.buffers.push(this.header([
            [100, name.toString()], // name
            [8, 0o644], // mode
            [8, 0o1000], // uid
            [8, 0o1000], // gid
            [12, data.length], // size
            [12, 0], // mtime
            [8, null], // checksum
            [1, "0"], // type
            [100, ""], // name of linked file (??)
            [255, ""], // padding
        ]));
        this.buffers.push(data);
        this.buffers.push(new ArrayBuffer(-data.length & 0x1FF));
    }

    header(fields) {
        const buffer = new ArrayBuffer(512);
        const u1 = new Uint8Array(buffer);
        let checksum = 0;
        let checksumPos = null;

        let pos = 0;
        for(const [size, val] of fields) {
            let string;
            if(val === null) {
                checksumPos = pos;
                string = " ".repeat(size);
            } else if(typeof val === "string") {
                string = val;
            } else if(typeof val === "number") {
                string = val.toString(8).padStart(size-1, "0");
            }
            if(string.length > size) throw new Error(`${string} is longer than ${size} characters`);
            Array.from(string).forEach((c, i) => checksum += u1[pos+i] = c.charCodeAt());
            pos += size;
        }
        Array.from("\0".repeat(8)).forEach((c, i) => u1[checksumPos+i] = c.charCodeAt());
        Array.from(checksum.toString(8).padStart(7, "0")).forEach((c, i) => u1[checksumPos+i] = c.charCodeAt());
        return buffer;
    }

    save(filename) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob(this.buffers, {"type": "application/x-tar"}));
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }
};
