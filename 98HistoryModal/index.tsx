import definePlugin, { OptionType } from "@utils/types";
import ErrorBoundary from "@components/ErrorBoundary";
import { closeModal, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { Parser, Text, Timestamp, Tooltip, useState } from "@webpack/common";
import { classNameFactory } from "@api/Styles";
import { findByPropsLazy } from "@webpack";

import "./styles.css";

const CodeContainerClasses = findByPropsLazy("markup", "codeContainer");
const MiscClasses = findByPropsLazy("messageContent", "markupRtl");
// findByPropsLazy("getElementFromMessage", "ThreadStarterChatMessage").default

const cl = classNameFactory("c98-history-");

let old_renderEdit;

export default definePlugin({
    name: "98HistoryModal",
    description: "Shows edit history in a modal, instead of inline",
    authors: [{ id: 236588665420251137n, name: "Kyuuhachi" }],

    dependencies: ["MessageLogger"],

    patches: [
        {
            find: "Messages.MESSAGE_EDITED,\")\"",
            replacement: [
                {
                    match: /"span",\{/,
                    replace: "$self.EditMarker,{message:arguments[0].message,"
                }
            ]
        },
    ],

    EditMarker({message, ...props}) {
        let child = VencordCreateElement("span", props);
        return message.editHistory?.length || true
            ? <span
                class={cl("history")}
                onClick={() => showHistory(message)}
                >{child}</span>
            : child;
    },

    start() {
        let ML = Vencord.Plugins.plugins.MessageLogger;
        old_renderEdit = ML.renderEdit;
        ML.renderEdit = () => {};
    },
    stop() {
        ML.renderEdit = old_renderEdit;
    },
});

function showHistory(message) {
    const key = openModal(props =>
        <ErrorBoundary>
            <ModalRoot {...props} size={ModalSize.LARGE}>
                <HistoryModal key={key} message={message} />
            </ModalRoot>
        </ErrorBoundary>
    )
}

function HistoryModal({key, message}) {
    const [selected, selectItem] = useState(message.editHistory.length);
    // TODO the first timestamp is not necessarily correct, I want some way to store the oldest known edited-timestamp
    const timestamps = [message.timestamp, ...message.editHistory.map(a => a.timestamp)];
    const contents = [...message.editHistory.map(a => a.content), message.content];

    return <>
        <ModalHeader className={cl("modal-head")}>
            <Text variant="heading-lg/semibold">Message edit history</Text>
            <ModalCloseButton onClick={() => closeModal(key)} />
            <div className={cl("revisions")}>
                {...timestamps.map((timestamp, index) =>
                    <button
                        className={cl("revision", {"revision-active": selected === index})}
                        onClick={() => selectItem(index)}
                    >
                        <Timestamp
                            className={cl("timestamp")}
                            timestamp={timestamp}
                            isEdited={true}
                            isInline={false}
                        />
                    </button>
                )}
            </div>
        </ModalHeader>
        <ModalContent className={cl("contents")}>
            {...contents.map((content, index) =>
                <div className={cl("content", {"content-active": selected == index})}>
                    <div className={`${CodeContainerClasses.markup} ${MiscClasses.messageContent}`}>
                        {Parser.parse(content)}
                    </div>
                </div>
            )}
        </ModalContent>
    </>
}
