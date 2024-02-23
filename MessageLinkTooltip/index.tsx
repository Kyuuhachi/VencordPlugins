import "./style.css";

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin, { OptionType } from "@utils/types";
import { findComponentByCodeLazy } from "@webpack";
import { Component } from "react"
import { RestAPI, MessageStore, Forms, Tooltip, ChannelStore, useState, useStateFromStores, useEffect } from "@webpack/common"

const ChannelMessage = findComponentByCodeLazy("renderSimpleAccessories)");

export default definePlugin({
    name: "MessageLinkTooltip",
    description: "Like MessageLinkEmbed but without taking space",
    authors: [{ id: 236588665420251137n, name: "Kyuuhachi" }],

    patches: [
        {
            find: ',className:"channelMention",children:[',
            replacement: {
                match: /(?<=\.jsxs\)\()(\i\.default)/,
                replace: "$self.wrapComponent(arguments[0], $1)"
            }
        }
    ],

    wrapComponent(mention, Component) {
        return (props) => {
            if(mention.messageId == undefined) return <Component {...props} />;
            return <Tooltip
                tooltipClassName="c98-message-link-tooltip"
                text={() => (
                    <ErrorBoundary>
                        <MessagePreview
                            channelId={mention.channelId}
                            messageId={mention.messageId}
                        />
                    </ErrorBoundary>
                )}
            >
                {({ onMouseEnter, onMouseLeave }) =>
                    <Component
                        {...props}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                    />
                }
            </Tooltip>;
        }
    }
});

function MessagePreview({ channelId, messageId }) {
    const channel = ChannelStore.getChannel(channelId);
    const message = useMessage(channelId, messageId);
    // TODO handle load failure
    if(!message) {
        return <Forms.Spinner type={Forms.Spinner.Type.PULSING_ELLIPSIS} />;
    }

    return <ChannelMessage
        id={`message-link-tooltip-${messageId}`}
        message={message}
        channel={channel}
        subscribeToComponentDispatch={false}
    />;
}

function useMessage(channelId, messageId) {
    const cachedMessage = useStateFromStores(
        [MessageStore],
        () => MessageStore.getMessage(channelId, messageId)
    );
    const [message, setMessage] = useState(cachedMessage);
    useEffect(() => {
        if(message == null)
            (async () => {
                const res = await RestAPI.get({
                    url: `/channels/${channelId}/messages`,
                    query: {
                        limit: 1,
                        around: messageId,
                    },
                    retries: 2,
                });
                const rawMessage = res.body[0];
                const message = MessageStore.getMessages(channelId)
                    .receiveMessage(rawMessage)
                    .get(messageId);
                setMessage(message);
            })();
    });
    return message;
}
