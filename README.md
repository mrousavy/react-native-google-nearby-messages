# react-native-google-nearby-messages

A Google Nearby Messages API Wrapper for React Native.

## Install

```sh
npm i react-native-google-nearby-messages
```

> This package uses react-native autolinking.

## Usage

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
