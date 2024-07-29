import "./style.css";

import { definePluginSettings } from "@api/Settings";
import { getUserSettingLazy } from "@api/UserSettings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import { proxyLazy } from "@utils/lazy";
import definePlugin from "@utils/types";
import { findComponentByCodeLazy } from "@webpack";
import { ChannelStore, Constants, Forms, MessageStore, RestAPI, Tooltip, useEffect, useState, useStateFromStores } from "@webpack/common";
import type { ComponentType, HTMLAttributes } from "react";

declare enum SpinnerTypes {
    WANDERING_CUBES = "wanderingCubes",
    CHASING_DOTS = "chasingDots",
    PULSING_ELLIPSIS = "pulsingEllipsis",
    SPINNING_CIRCLE = "spinningCircle",
    SPINNING_CIRCLE_SIMPLE = "spinningCircleSimple",
    LOW_MOTION = "lowMotion",
}

type Spinner = ComponentType<Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    type?: SpinnerTypes;
    animated?: boolean;
    className?: string;
    itemClassName?: string;
    "aria-label"?: string;
}> & {
    Type: typeof SpinnerTypes;
};

const { Spinner } = proxyLazy(() => Forms as any as {
    Spinner: Spinner,
    SpinnerTypes: typeof SpinnerTypes;
});

const MessageDisplayCompact = getUserSettingLazy("textAndImages", "messageDisplayCompact")!;

const ChannelMessage = findComponentByCodeLazy("isFirstMessageInForumPost", "trackAnnouncementViews") as ComponentType<any>;

const settings = {
    display: {
        description: "Display style",
        type: OptionType.SELECT,
        options: [
            {
                label: "Same as message",
                value: "auto",
                default: true
            },
            {
                label: "Compact",
                value: "compact"
            },
            {
                label: "Cozy",
                value: "cozy"
            },
        ]
    },
};

export default definePlugin({
    name: "MessageLinkTooltip",
    description: "Like MessageLinkEmbed but without taking space",
    authors: [Devs.Kyuuhachi],

    settings,

    patches: [
        {
            find: ',className:"channelMention",children:[',
            replacement: {
                match: /(?<=\.jsxs\)\()(\i\.\i)(?=,\{role:"link")/,
                replace: "$self.wrapComponent(arguments[0], $1)"
            }
        }
    ],

    wrapComponent({ messageId, channelId }, Component: ComponentType) {
        return props => {
            if(messageId === undefined) return <Component {...props} />;
            return <Tooltip
                tooltipClassName="c98-message-link-tooltip"
                text={
                    <ErrorBoundary>
                        <MessagePreview
                            channelId={channelId}
                            messageId={messageId}
                        />
                    </ErrorBoundary>
                }
            >
                {({ onMouseEnter, onMouseLeave }) =>
                    <Component
                        {...props}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                    />
                }
            </Tooltip>;
        };
    }
});

function MessagePreview({ channelId, messageId }) {
    const channel = ChannelStore.getChannel(channelId);
    const message = useMessage(channelId, messageId);
    const rawCompact = MessageDisplayCompact.useSetting();

    const compact = settings.store.display == "compact" ? true : settings.store.display == "cozy" ? false : rawCompact;

    // TODO handle load failure
    if(!message) {
        return <Spinner type={Spinner.Type.PULSING_ELLIPSIS} />;
    }

    return <ChannelMessage
        id={`message-link-tooltip-${messageId}`}
        message={message}
        channel={channel}
        subscribeToComponentDispatch={false}
        compact={compact}
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
                    url: Constants.Endpoints.MESSAGES(channelId)`,
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
