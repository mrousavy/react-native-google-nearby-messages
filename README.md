# react-native-google-nearby-messages

A Google Nearby Messages API Wrapper for React Native.

## Install

```sh
npm i react-native-google-nearby-messages
```

> This package uses react-native autolinking.

## Usage

### iOS Setup

> See: https://developers.google.com/nearby/messages/ios/get-started

1. Create your Key at [the Google Developer Console](https://console.developers.google.com/flows/enableapi?apiid=copresence&keyType=CLIENT_SIDE_IOS&reusekey=true).
2. Pass the generated API Key as a parameter using the `connect` function.

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
