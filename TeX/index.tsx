import "./style.css";

import definePlugin from "@utils/types";
import { React, Tooltip, useMemo } from "@webpack/common";

import { useKatex } from "./katex_loader";

export default definePlugin({
    name: "TeX",
    description: "Typesets math in messages, written as `$x$` or `$$x$$`.",
    authors: [{ id: 236588665420251137n, name: "Kyuuhachi" }],

    patches: [
        {
            find: "inlineCode:{react",
            replacement: {
                match: /inlineCode:\{react:\((\i,\i,\i)\)=>/,
                replace: "$&$self.render($1)??"
            },
        },
    ],

    render({ content }) {
        const displayMatch = /^\$\$(.*)\$\$$/.exec(content);
        const inlineMatch = /^\$(.*)\$$/.exec(content);
        if(displayMatch)
            return <LazyLatex displayMode formula={displayMatch[1]} delim="$$" />;
        if(inlineMatch)
            return <LazyLatex formula={inlineMatch[1]} delim="$" />;
    }
});

function LazyLatex(props) {
    const { formula, delim } = props;
    const katex = useKatex();
    return katex
        ? <Latex {...props} katex={katex} />
        : <code className="tex-loading code">{delim}{formula}{delim}</code>;
}

function Latex({ katex, formula, displayMode, delim }) {
    const result = useMemo(() => {
        try {
            const html = katex.renderToString(formula, { displayMode });
            return { html };
        } catch(error) {
            return { error };
        }
    }, [formula, displayMode]);

    return result.html
        ? <span className="tex" dangerouslySetInnerHTML={{ __html: result.html }} />
        : <LatexError formula={formula} delim={delim} error={result.error} />;
}

function LatexError({ formula, delim, error }) {
    const { rawMessage, position, length } = error;
    const pre = formula.slice(0, position);
    const mid = formula.slice(position, position+length);
    const suf = formula.slice(position+length);
    return (
        <Tooltip text={rawMessage}>
            {({ onMouseLeave, onMouseEnter }) => (
                <code
                    onMouseLeave={onMouseLeave}
                    onMouseEnter={onMouseEnter}
                    className="tex-error inline"
                >
                    {delim}
                    {pre}
                    <strong>{mid}</strong>
                    {suf}
                    {delim}
                </code>
            )}
        </Tooltip>
    );
}
