import { NativeModules } from 'react-native';

const { GoogleNearbyMessages } = NativeModules;

export default function NBincrement(): void {
    console.log('Nearby Messages invoked. Native Module: ', GoogleNearbyMessages);
    GoogleNearbyMessages.increment();
}
