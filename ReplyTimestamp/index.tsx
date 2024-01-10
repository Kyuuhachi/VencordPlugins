import "./style.css";

import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Timestamp } from "@webpack/common";

const MessageIds = findByPropsLazy("getMessageTimestampId");
const DateUtils = findByPropsLazy("calendarFormat", "dateFormat", "isSameDay", "accessibilityLabelCalendarFormat");
const MessageClasses = findByPropsLazy("separator", "latin24CompactTimeStamp");

function Sep(props) {
    return <i className={MessageClasses.separator} aria-hidden={true} {...props} />;
}

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

    ReplyTimestamp({ referencedMessage, baseMessage }) {
        if(referencedMessage.state === 0) {
            const refTimestamp = referencedMessage.message.timestamp;
            const baseTimestamp = baseMessage.timestamp;
            return <Timestamp
                id={MessageIds.getMessageTimestampId(referencedMessage.message)}
                className="c98-reply-timestamp"
                compact={refTimestamp.isSame(baseTimestamp, "date")}
                timestamp={refTimestamp}
                isInline={false}
            >
                <Sep>[</Sep>
                { DateUtils.isSameDay(refTimestamp, baseTimestamp)
                    ? DateUtils.dateFormat(refTimestamp, "LT")
                    : DateUtils.calendarFormat(refTimestamp)
                }
                <Sep>]</Sep>
            </Timestamp>;
        }
    },
});
