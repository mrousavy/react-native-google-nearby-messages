import { NativeModules } from 'react-native';

const { GoogleNearbyMessages } = NativeModules;

export default function sampleMethod(stringArg: string, numberArg: number, callback: (message: string) => void): void {
    console.log('Nearby Messages invoked');
    GoogleNearbyMessages.sampleMethod(stringArg, numberArg, callback);
}
