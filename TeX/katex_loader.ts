import { makeLazy } from "@utils/lazy";
import { useEffect, useState } from "@webpack/common";

const SCRIPT_URL = "https://unpkg.com/katex@0.16.9/dist/katex.mjs";
const STYLE_URL = "https://unpkg.com/katex@0.16.9/dist/katex.min.css";

let theKatex: undefined | any = undefined;
export const loadKatex = makeLazy(async () => {
    const style = document.createElement("link");
    style.setAttribute("rel", "stylesheet");
    style.setAttribute("href", STYLE_URL);
    document.head.appendChild(style);
    return theKatex = (await import(SCRIPT_URL)).default;
});

export function useKatex() {
    const [katex, setKatex] = useState(theKatex);
    useEffect(() => {
        if(katex === undefined)
            loadKatex().then(setKatex);
    });
    return katex;
}
