import { NativeModules, NativeEventEmitter } from 'react-native';

const { GoogleNearbyMessages } = NativeModules;
const nearbyEventEmitter = new NativeEventEmitter(GoogleNearbyMessages);

export type EventType = 'MESSAGE_FOUND' | 'MESSAGE_LOST' | 'BLUETOOTH_ERROR' | 'PERMISSION_ERROR' | 'MESSAGE_NO_DATA_ERROR';
interface BridgeMessageEvent {
    message?: string;
}
interface BridgeErrorEvent {
    error?: string;
}

/**
 * Initialize and connect the Google Nearby Messages API
 * @param apiKey The Google API key to use (only required on iOS) - @see https://console.developers.google.com/flows/enableapi?apiid=copresence&keyType=CLIENT_SIDE_IOS&reusekey=true
 */
export function connect(apiKey: string): Promise<void> {
    return GoogleNearbyMessages.connect(apiKey);
}

/**
 * Disconnect the Google Nearby Messages API. Also removes any existing subscriptions or publications.
 */
export function disconnect(): Promise<void> {
    return GoogleNearbyMessages.disconnect();
}

/**
 * Subscribe to nearby message events. Use onMessageFound and onMessageLost to receive callbacks for found and lost messages. Always call unsubscribe() to stop publishing.
 */
export function subscribe(): Promise<() => void> {
    return GoogleNearbyMessages.subscribe();
}

/**
 * Unsubscribe the current subscription.
 */
export function unsubscribe(): Promise<void> {
    return GoogleNearbyMessages.unsubscribe();
}

/**
 * Publish/Broadcast a new message. Always call unpublish() to stop publishing.
 * @param message The message to broadcast.
 */
export function publish(message: string): Promise<void> {
    return GoogleNearbyMessages.publish(message);
}

/**
 * Stop publishing the last message. Can only call after @see publish has been called.
 */
export function unpublish(): Promise<void> {
    return GoogleNearbyMessages.unpublish();
}

/**
 * Checks if the User has given Bluetooth Permission. If not yet asked, a "grant permission?" dialog will pop up.
 */
export function checkBluetoothPermission(): Promise<boolean> {
    return GoogleNearbyMessages.checkBluetoothPermission();
}

/**
 * Subscribe to new messages (Uses EventEmitterSubscription for the MESSAGE_FOUND event)
 * @param callback The function to call when a new message has been found
 * @returns A function to unsubscribe (call on unmount)
 */
export function onMessageFound(callback: (message?: string) => void): () => void {
    return onEvent('MESSAGE_FOUND', callback);
}

/**
 * Subscribe to lost messages (Uses EventEmitterSubscription for the MESSAGE_LOST event)
 * @param callback The function to call when an existing message has been lost
 * @returns A function to unsubscribe (call on unmount)
 */
export function onMessageLost(callback: (message?: string) => void): () => void {
    return onEvent('MESSAGE_LOST', callback);
}

/**
 * Subscribe to any errors
 * @param callback The function to call when an error occurs
 */
export function onError(callback: (kind: 'BLUETOOTH_ERROR' | 'PERMISSION_ERROR' | 'MESSAGE_NO_DATA_ERROR', error?: string) => void): () => void {
    const bluetoothErrorUnsubscribe = onErrorEvent('BLUETOOTH_ERROR', (m) => callback('BLUETOOTH_ERROR', m));
    const permissionErrorUnsubscribe = onErrorEvent('PERMISSION_ERROR', (m) => callback('PERMISSION_ERROR', m));
    const messageNoDataErrorUnsubscribe = onErrorEvent('MESSAGE_NO_DATA_ERROR', (m) => callback('MESSAGE_NO_DATA_ERROR', m));
    return () => {
        bluetoothErrorUnsubscribe();
        permissionErrorUnsubscribe();
        messageNoDataErrorUnsubscribe();
    };
}

function onEvent(event: EventType, callback: (message?: string) => void): () => void {
    console.log(`adding ${event}`);
    const subscription = nearbyEventEmitter.addListener(event, (data: BridgeMessageEvent) => callback(data.message));
    return () => {
        console.log(`removing ${event}`);
        subscription.remove();
    }
}

function onErrorEvent(event: EventType, callback: (error?: string) => void): () => void {
    console.log(`adding ${event}`);
    const subscription = nearbyEventEmitter.addListener(event, (data: BridgeErrorEvent) => callback(data.error));
    return () => {
        console.log(`removing ${event}`);
        subscription.remove();
    }
}
