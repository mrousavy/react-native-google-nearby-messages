import { NativeModules, NativeEventEmitter } from 'react-native';

const { GoogleNearbyMessages } = NativeModules;
const nearbyEventEmitter = new NativeEventEmitter(GoogleNearbyMessages);

export type EventType = 'MESSAGE_FOUND' | 'MESSAGE_LOST' | 'BLUETOOTH_ERROR' | 'PERMISSION_ERROR';

export function connect(apiKey: string): Promise<void> {
    console.log('Nearby Messages invoked. Native Module: ', GoogleNearbyMessages);
    return GoogleNearbyMessages.connect(apiKey);
}

export function disconnect(): Promise<void> {
    return GoogleNearbyMessages.disconnect();
}

export function subscribe(): Promise<() => void> {
    console.log('Nearby Messages invoked. Native Module: ', GoogleNearbyMessages);
    return GoogleNearbyMessages.subscribe();
}

export function unsubscribe(callback: (message: string) => void): Promise<void> {
    console.log('Nearby Messages invoked. Native Module: ', GoogleNearbyMessages);
    return GoogleNearbyMessages.unsubscribe();
}

export function publish(message: string): Promise<void> {
    console.log('Nearby Messages invoked. Native Module: ', GoogleNearbyMessages);
    return GoogleNearbyMessages.publish(message);
}

export function unpublish(): Promise<void> {
    console.log('Nearby Messages invoked. Native Module: ', GoogleNearbyMessages);
    return GoogleNearbyMessages.unpublish();
}

export function onMessageFound(callback: (message: string) => void) {
    return onEvent('MESSAGE_FOUND', callback);
}

export function onMessageLost(callback: (message: string) => void) {
    return onEvent('MESSAGE_FOUND', callback);
}

export function onError(callback: (kind: 'BLUETOOTH_ERROR' | 'PERMISSION_ERROR', message: string) => void) {
    const bluetoothErrorUnsubscribe = onEvent('BLUETOOTH_ERROR', (m) => callback('BLUETOOTH_ERROR', m));
    const permissionErrorUnsubscribe = onEvent('PERMISSION_ERROR', (m) => callback('PERMISSION_ERROR', m));
    return () => {
        bluetoothErrorUnsubscribe();
        permissionErrorUnsubscribe();
    }
}

export function onEvent(event: EventType, callback: (message: string) => void) {
    return nearbyEventEmitter.addListener(event, callback);
}
