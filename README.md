# react-native-google-nearby-messages

An async **Google Nearby Messages** API Wrapper for **React Native**, using the newest API Version (`17`). Also, this is a good example on how to use _Swift_ in a React Native Native Module.

## Install

```sh
npm i react-native-google-nearby-messages
```

> This package uses react-native autolinking.

## Usage

See the [example app](example/).

### iOS Setup

> See: https://developers.google.com/nearby/messages/ios/get-started

1. Create your Key at [the Google Developer Console](https://console.developers.google.com/flows/enableapi?apiid=copresence&keyType=CLIENT_SIDE_IOS&reusekey=true).
2. Pass the generated API Key as a parameter using the `connect` function.
3. Add bluetooth permissions (`NSBluetoothPeripheralUsageDescription`, `NSBluetoothAlwaysUsageDescription`) to `Info.plist`

### Android Setup

> See: https://developers.google.com/nearby/messages/android/get-started

1. Create your Key at [the Google Developer Console](https://console.developers.google.com/flows/enableapi?apiid=copresence&keyType=CLIENT_SIDE_ANDROID&reusekey=true).
2. Add your generated API Key to your `AndroidManifest.xml`:

    ```xml
    <manifest xmlns:android="http://schemas.android.com/apk/res/android"
        package="com.google.sample.app" >
        <application ...>
            <meta-data
                android:name="com.google.android.nearby.messages.API_KEY"
                android:value="API_KEY" />
            <activity>
            ...
            </activity>
        </application>
    </manifest>
    ```

3. Add `android.permission.BLUETOOTH` and `android.permission.BLUETOOTH_ADMIN` permissions to `AndroidManifest.xml`. (Maybe also `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION`)

### Publishing

```ts
import { connect, publish, addOnErrorListener } from 'react-native-google-nearby-messages';

const removeListener = addOnErrorListener((kind, hasError) => console.error(`${kind}: ${hasError}`));
const disconnect = await connect('<yourAPIkey>'); // API Key not needed in Android, add to Manifest instead!
const unpublish = await publish('hello !');

// later, e.g. in componentWillUnmount()
removeListener();
unpublish();
disconnect();
```

> Make sure to unpublish, disconnect and remove any listeners as they won't be removed automatically! I don't know if that's possible, if so, please create a Pull Request.

### Subscribing

```ts
import { connect, subscribe, addOnErrorListener } from 'react-native-google-nearby-messages';

addOnErrorListener((kind, hasError) => console.error(`${kind}: ${hasError}`));
const disconnect = await connect('<yourAPIkey>'); // API Key not needed in Android, add to Manifest instead!
const unsubscribe = await subscribe(
  (m) => {
    console.log(`new message found: ${m}`);
  },
  (m) => {
    console.log(`message lost: ${m}`);
  });

// later, e.g. in componentWillUnmount()
removeListener();
unsubscribe();
disconnect();
```

> Make sure to unpublish, disconnect and remove any listeners as they won't be removed automatically! I don't know if that's possible, if so, please create a Pull Request.

### Bluetooth Permissions

```ts
import { checkBluetoothPermission } from 'react-native-google-nearby-messages';

const hasPermission = await checkBluetoothPermission();
```

## Troubleshooting

If you're having any trouble getting the Nearby API working, please make sure you're aware of these steps:

1. The library only supports BLE (bluetooth low energy). You can change it in the `GoogleNearbyMessagesModule.java` and `GoogleNearbyMessages.swift` files yourself, or create a pull-request with a customizable constructor.
2. The JS error codes (promise rejectors) should tell you enough information on what went wrong, check [this doc page](https://developers.google.com/android/reference/com/google/android/gms/nearby/messages/NearbyMessagesStatusCodes) on more information about each individual error code.
3. Make sure your device has BLE capabilities and the App has Permission to use those. Include the required Permissions in `Info.plist` and `AndroidManifest.xml`. Also try adding the `INTERNET`, `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` permissions if nothing else works.
4. Make sure your API Key is valid!
