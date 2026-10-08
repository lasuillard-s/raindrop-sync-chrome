import { writable } from "svelte/store";

export type Message = {
  id?: string;
  type: "success" | "info" | "error";
  message: string;
};

export type MessageBox = {
  [id: string]: Message;
};

export const messageBox = writable<MessageBox>({});

/**
 * Put message to message box.
 * @param message Message to put. If `.id` is not set, random generated ID will be used.
 * @returns ID of message.
 */
export function putMessage(message: Message): string {
  const id = message.id ?? Math.random().toString(36).substring(2);
  messageBox.update((box) => {
    box[id] = { id, ...message };
    return box;
  });
  return id;
}

/**
 * Dismiss message with ID.
 * @param id ID of message.
 */
export function dismissMessage(id?: string) {
  if (!id) return;

  messageBox.update((box) => {
    delete box[id];
    return box;
  });
}
