import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { GoogleNearbyMessages } = NativeModules;
const nearbyEventEmitter = new NativeEventEmitter(GoogleNearbyMessages);

export type EventType = 'MESSAGE_FOUND' | 'MESSAGE_LOST' | 'BLUETOOTH_ERROR' | 'PERMISSION_ERROR' | 'MESSAGE_NO_DATA_ERROR';
interface BridgeMessageEvent {
    message?: string;
}
interface BridgeErrorEvent {
    hasError?: boolean;
}

/**
 * Initialize and connect the Google Nearby Messages API
 * @param apiKey The Google API key to use (only required on iOS) - @see https://console.developers.google.com/flows/enableapi?apiid=copresence&keyType=CLIENT_SIDE_IOS&reusekey=true
 * @returns An unsubscriber function to disconnect the Google Nearby Messages API
 * @example
 * const disconnect = await connect();
 * // ...
 * disconnect();
 */
export async function connect(apiKey?: string): Promise<() => void> {
    if (Platform.OS === 'ios' && apiKey == null) throw new Error('API Key is required on iOS!');
    await GoogleNearbyMessages.connect(apiKey);
    return GoogleNearbyMessages.disconnect;
}

/**
 * Disconnect the Google Nearby Messages API. Also removes any existing subscriptions or publications.
 */
export function disconnect(): void {
    GoogleNearbyMessages.disconnect();
}

/**
 * Subscribe to nearby message events. Use onMessageFound and onMessageLost to receive callbacks for found and lost messages. Always call unsubscribe() to stop publishing.
  * @param onMessageFound (Optional) A function to call when a new message has been found
  * @param onMessageLost  (Optional) A function to call when an existing message has been lost
 *  @returns A function to unsubscribe the subscription and the event emitters if supplied.
 *  @example
 *  const unsubscribe = await subscribe(
 *      (m) => console.log(`found: ${m}`),
 *      (m) => console.log(`lost: ${m}`)
 *  );
 *  // ...
 *  unsubscribe();
 */
export async function subscribe(onMessageFound?: (message?: string) => void, onMessageLost?: (message?: string) => void): Promise<() => void> {
    await GoogleNearbyMessages.subscribe();
    const onMessageFoundUnsubscribe = onMessageFound ? onEvent('MESSAGE_FOUND', onMessageFound) : undefined;
    const onMessageLostUnsubscribe = onMessageLost ? onEvent('MESSAGE_LOST', onMessageLost) : undefined;
    return () => {
        if (onMessageFoundUnsubscribe) onMessageFoundUnsubscribe();
        if (onMessageLostUnsubscribe) onMessageLostUnsubscribe();
        unsubscribe();
    };
}

/**
 * Unsubscribe the current subscription.
 */
export function unsubscribe(): void {
    GoogleNearbyMessages.unsubscribe();
}

/**
 * Publish/Broadcast a new message. Always call unpublish() to stop publishing.
 * @param message The message to broadcast.
 * @returns An unsubscriber function to unpublish the currently published message.
 * @example
 * const unpublish = await publish('test');
 * // ...
 * unpublish();
 */
export async function publish(message: string): Promise<() => void> {
    await GoogleNearbyMessages.publish(message);
    return unpublish;
}

/**
 * Stop publishing the last message. Can only call after @see publish has been called.
 */
export function unpublish(): void {
    GoogleNearbyMessages.unpublish();
}

/**
 * Checks if the User has given Bluetooth Permission. If not yet asked, a "grant permission?" dialog will pop up.
 */
export function checkBluetoothPermission(): Promise<boolean> {
    return GoogleNearbyMessages.checkBluetoothPermission();
}

/**
 * Subscribe to any errors.
 * @param callback The function to call when an error occurs. Kind is the Error Type, and hasError specifies where there currently is an Error. e.g.: User turns Bluetooth off, callback gets called with ('BLUETOOTH_ERROR', true). When the User turns Bluetooth back on, callback gets called again with ('BLUETOOTH_ERROR', false).
 */
export function addOnErrorListener(callback: (kind: 'BLUETOOTH_ERROR' | 'PERMISSION_ERROR' | 'MESSAGE_NO_DATA_ERROR', hasError?: boolean) => void): () => void {
    const bluetoothErrorUnsubscribe = onErrorEvent('BLUETOOTH_ERROR', (h) => callback('BLUETOOTH_ERROR', h));
    const permissionErrorUnsubscribe = onErrorEvent('PERMISSION_ERROR', (h) => callback('PERMISSION_ERROR', h));
    const messageNoDataErrorUnsubscribe = onErrorEvent('MESSAGE_NO_DATA_ERROR', (h) => callback('MESSAGE_NO_DATA_ERROR', h));
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

function onErrorEvent(event: EventType, callback: (hasError?: boolean) => void): () => void {
    console.log(`adding ${event}`);
    const subscription = nearbyEventEmitter.addListener(event, (data: BridgeErrorEvent) => callback(data.hasError));
    return () => {
        console.log(`removing ${event}`);
        subscription.remove();
    }
}
