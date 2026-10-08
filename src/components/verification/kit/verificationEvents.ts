// Lets a queue drop a record the moment it is actioned. Relying only on the queue's
// reload-on-focus left verified items on screen (the reload keeps the old rows visible until it
// returns, and returns late or stale on slow links). Detail screens register the row they were
// opened with (useRowParam does this); showDone announces it, and the queue hides that row at
// once and reloads.
import { Alert } from 'react-native';

type Listener = (row: unknown) => void;

const listeners = new Set<Listener>();
let openRow: unknown = null;

export const setOpenRow = (row: unknown) => {
    openRow = row;
};

export const clearOpenRow = (row: unknown) => {
    if (openRow === row) openRow = null;
};

export const onVerified = (listener: Listener) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

export const announceVerified = () => {
    listeners.forEach((l) => l(openRow));
};

// "Done" message after a successful action: the queue is updated before the alert shows,
// so it is already correct whether or not OK is tapped.
export const showDone = (message: string, onDone: () => void, title = 'Done') => {
    announceVerified();
    Alert.alert(title, message, [{ text: 'OK', onPress: onDone }], { cancelable: false });
};
