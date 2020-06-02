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

### Subscribing

```ts
import { connect, subscribe, unsubscribe, addOnErrorListener } from 'react-native-google-nearby-messages';

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

### Bluetooth Permissions

```ts
import { checkBluetoothPermission } from 'react-native-google-nearby-messages';

const hasPermission = await checkBluetoothPermission();
```
