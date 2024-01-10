import "./style.css";

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Timestamp } from "@webpack/common";

const MessageIds = findByPropsLazy("getMessageTimestampId");

export default definePlugin({
    name: "Reply Timestamp",
    description: "Shows a timestamp on replied-message previews",
    authors: [{ id: 236588665420251137n, name: "Kyuuhachi" }],

    patches: [
        {
            find: ",{renderSingleLineMessage:function(){return ",
            replacement: {
                match: /(?<="aria-label":\w+,children:\[)(?=\w+,\w+,\w+\])/,
                replace: "$self.ReplyTimestamp(arguments[0]),"
            }
        }
    ],

    ReplyTimestamp({referencedMessage, baseMessage}) {
        if(referencedMessage.state === 0) {
            const refTimestamp = referencedMessage.message.timestamp;
            const baseTimestamp = baseMessage.timestamp;
            return <Timestamp
                id={MessageIds.getMessageTimestampId(referencedMessage.message)}
                className="c98-reply-timestamp"
                compact={refTimestamp.isSame(baseTimestamp, "date")}
                timestamp={refTimestamp}
                isInline={false}
            />;
        }
    },
});
