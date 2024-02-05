import "./styles.css";

import { classNameFactory } from "@api/Styles";
import ErrorBoundary from "@components/ErrorBoundary";
import { closeModal, ModalCloseButton, ModalContent, ModalHeader, ModalProps, ModalRoot, ModalSize, openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Parser, Text, Timestamp, useState } from "@webpack/common";
import { Message as _Message } from "discord-types/general";
import { HTMLAttributes } from "react";

type Message = _Message & { editHistory: { timestamp: any, content: string }[] };

const CodeContainerClasses = findByPropsLazy("markup", "codeContainer");
const MiscClasses = findByPropsLazy("messageContent", "markupRtl");

const cl = classNameFactory("c98-history-");

let old_renderEdit: Function;

export default definePlugin({
    name: "HistoryModal",
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

    EditMarker({ message, ...props }: { message: Message } & HTMLAttributes<HTMLElement>) {
        const child = <span {...props} />;
        return <span
            className={cl("history")}
            onClick={() => showHistory(message)}
        >{child}</span>;
    },

    start() {
        const ML = Vencord.Plugins.plugins.MessageLogger as any;
        old_renderEdit = ML.renderEdit;
        ML.renderEdit = () => {};
    },
    stop() {
        const ML = Vencord.Plugins.plugins.MessageLogger as any;
        ML.renderEdit = old_renderEdit;
    },
});

function showHistory(message: Message) {
    const key = openModal(props =>
        <ErrorBoundary>
            <HistoryModal
                modalProps={props}
                close={() => closeModal(key)}
                message={message}
            />
        </ErrorBoundary>
    );
}

function HistoryModal({ modalProps, close, message }: { modalProps: ModalProps; close(): void; message: Message }) {
    const [selected, selectItem] = useState(message.editHistory.length);
    // TODO the first timestamp is not necessarily correct, I want some way to store the oldest known edited-timestamp
    const timestamps = [message.timestamp, ...message.editHistory.map(a => a.timestamp)];
    const contents = [...message.editHistory.map(a => a.content), message.content];

    return <ModalRoot {...modalProps} size={ModalSize.LARGE}>
        <ModalHeader className={cl("modal-head")}>
            <Text variant="heading-lg/semibold">Message edit history</Text>
            <ModalCloseButton onClick={close} />
            <div className={cl("revisions")}>
                {...timestamps.map((timestamp, index) =>
                    <button
                        className={cl("revision", { "revision-active": selected === index })}
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
                <div className={cl("content", { "content-active": selected === index })}>
                    <div className={`${CodeContainerClasses.markup} ${MiscClasses.messageContent}`}>
                        {Parser.parse(content)}
                    </div>
                </div>
            )}
        </ModalContent>
    </ModalRoot>;
}
