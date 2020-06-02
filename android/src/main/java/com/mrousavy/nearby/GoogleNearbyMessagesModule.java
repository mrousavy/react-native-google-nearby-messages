package com.mrousavy.nearby;

import android.Manifest;
import android.content.pm.PackageManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.nearby.Nearby;
import com.google.android.gms.nearby.messages.Message;
import com.google.android.gms.nearby.messages.MessageListener;
import com.google.android.gms.nearby.messages.MessagesClient;
import com.google.android.gms.nearby.messages.MessagesOptions;
import com.google.android.gms.nearby.messages.NearbyPermissions;
import com.google.android.gms.nearby.messages.PublishCallback;
import com.google.android.gms.nearby.messages.PublishOptions;
import com.google.android.gms.nearby.messages.Strategy;
import com.google.android.gms.nearby.messages.SubscribeCallback;
import com.google.android.gms.nearby.messages.SubscribeOptions;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import org.jetbrains.annotations.NotNull;

public class GoogleNearbyMessagesModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    private enum EventType {
        MESSAGE_FOUND("MESSAGE_FOUND"),
        MESSAGE_LOST("MESSAGE_LOST"),
        BLUETOOTH_ERROR("BLUETOOTH_ERROR"),
        PERMISSION_ERROR("PERMISSION_ERROR"),
        MESSAGE_NO_DATA_ERROR("MESSAGE_NO_DATA_ERROR");

        private final String _type;

        EventType(String type) {
            _type = type;
        }

        @Override
        public String toString() {
            return _type;
        }
    }

    private MessagesClient _messagesClient;
    @Nullable
    private Message _publishedMessage;
    private boolean _isSubscribed;
    private MessageListener _listener;
    private SubscribeOptions _subscribeOptions;
    private PublishOptions _publishOptions;
    private final ReactApplicationContext reactContext;

    public GoogleNearbyMessagesModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;

    }

    // TODO: I'm getting Attempting to perform a high power operation from a non-Activity Context
    @ReactMethod
    public void connect(final String apiKey, final Promise promise) {
        Log.d(getName(), "Connecting...");
        _listener = new MessageListener() {
            @Override
            public void onFound(Message message) {
                Log.d(getName(), "Message found!");
                this.onFound(message);
            }

            @Override
            public void onLost(Message message) {
                Log.d(getName(), "Message lost!");
                this.onLost(message);
            }
        };
        _messagesClient = Nearby.getMessagesClient(getReactApplicationContext(), new MessagesOptions.Builder().setPermissions(NearbyPermissions.BLE).build());
        _subscribeOptions = new SubscribeOptions.Builder()
                .setStrategy(Strategy.BLE_ONLY)
                .setCallback(new SubscribeCallback() {
                    @Override
                    public void onExpired() {
                        super.onExpired();
                        Log.i(getName(), "No longer subscribing");
                        emitErrorEvent(EventType.BLUETOOTH_ERROR, true);
                    }
                }).build();
        _publishOptions = new PublishOptions.Builder()
                .setStrategy(Strategy.BLE_ONLY)
                .setCallback(new PublishCallback(){
                    @Override
                    public void onExpired() {
                        super.onExpired();
                        Log.i(getName(), "No longer publishing");
                        emitErrorEvent(EventType.BLUETOOTH_ERROR, true);
                    }
                }).build();
        _isSubscribed = false;
        promise.resolve(null);
        Log.d(getName(), "Connected!");
    }

    @ReactMethod
    public void disconnect() {
        _listener = null;
        _messagesClient = null;
        _subscribeOptions = null;
        _publishOptions = null;
        _isSubscribed = false;
    }

    @ReactMethod
    public void subscribe(final Promise promise) {
        Log.d(getName(), "Subscribing...");
        if (_messagesClient != null) {
            if (_isSubscribed) {
                promise.reject(new Exception("An existing callback is already subscribed to the Google Nearby Messages API! Please unsubscribe before subscribing again!"));
            } else {
                _messagesClient.subscribe(_listener, _subscribeOptions).addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        Exception e = task.getException();
                        Log.d(getName(), "Subscribed! With error:" + e.getLocalizedMessage());
                        if (e != null) {
                            _isSubscribed = false;
                            promise.reject(e);
                        } else {
                            _isSubscribed = true;
                            promise.resolve(null);
                        }
                    }
                });
            }
        } else {
            promise.reject(new Exception("The Messages Client was null. Did the GoogleNearbyMessagesModule native constructor fail to execute?"));
        }
    }

    @ReactMethod
    public void unsubscribe(final Promise promise) {
        Log.d(getName(), "Unsubscribing...");
        if (_messagesClient != null) {
            _messagesClient.unsubscribe(_listener).addOnCompleteListener(new OnCompleteListener<Void>() {
                @Override
                public void onComplete(@NonNull Task<Void> task) {
                    Log.d(getName(), "Unsubscribed!");
                    Exception e = task.getException();
                    if (e != null) {
                        promise.reject(e);
                    } else {
                        _isSubscribed = false;
                        promise.resolve(null);
                    }
                }
            });
        } else {
            promise.reject(new Exception("The Messages Client was null. Did the GoogleNearbyMessagesModule native constructor fail to execute?"));
        }
    }

    @ReactMethod
    public void publish(String message, final Promise promise) {
        if (_messagesClient != null) {
            if (_publishedMessage != null) {
                promise.reject(new Exception("There is an active published message! Call unpublish first!"));
            } else {
                _publishedMessage = new Message(message.getBytes());
                _messagesClient.publish(_publishedMessage, _publishOptions).addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        Exception e = task.getException();
                        if (e != null) promise.reject(e);
                        else promise.resolve(null);
                    }
                });
            }
        } else {
            promise.reject(new Exception("The Messages Client was null. Did the GoogleNearbyMessagesModule native constructor fail to execute?"));
        }
    }

    @ReactMethod
    public void unpublish(final Promise promise) {
        if (_messagesClient != null) {
            if (_publishedMessage != null) {
                _messagesClient.unpublish(_publishedMessage).addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        Exception e = task.getException();
                        if (e != null) promise.reject(e);
                        else promise.resolve(null);
                    }
                });
            } else {
                promise.reject(new Exception("The last published message was null. Did you publish before calling unpublish?"));
            }
        } else {
            promise.reject(new Exception("The Messages Client was null. Did the GoogleNearbyMessagesModule native constructor fail to execute?"));
        }
    }

    @ReactMethod
    public void checkBluetoothPermission(final Promise promise) {
        if (ContextCompat.checkSelfPermission(getReactApplicationContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            promise.resolve(true);
        } else {
            promise.resolve(false);
        }
    }

    // Google Nearby Messages API Callbacks
    public void onFound(Message message) {
        String messageString = new String(message.getContent());
        Log.d(getName(), "Found message: " + messageString);
        emitMessageEvent(EventType.MESSAGE_FOUND, messageString);
    }

    public void onLost(Message message) {
        String messageString = new String(message.getContent());
        Log.d(getName(), "Lost message: " + messageString);
        emitMessageEvent(EventType.MESSAGE_LOST, messageString);
    }

    // React Native Event Emitters
    private void emitMessageEvent(@NotNull EventType event, @NotNull String message) {
        Log.d(getName(), "Emit Message Event! " + event.toString());
        WritableMap params = Arguments.createMap();
        params.putString("message", message);

        ReactApplicationContext context = getReactApplicationContext();
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(event.toString(), params);
    }

    private void emitErrorEvent(@NotNull EventType event, @NotNull boolean hasError) {
        Log.d(getName(), "Emit Error Event! " + event.toString());
        WritableMap params = Arguments.createMap();
        params.putString("hasError", String.valueOf(hasError));

        ReactApplicationContext context = getReactApplicationContext();
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(event.toString(), params);
    }

    // React Native Lifecycle Methods
    @Override
    public void onHostResume() {
        Log.d(getName(), "onHostResume");
    }

    @Override
    public void onHostPause() {
        Log.d(getName(), "onHostPause");
    }

    @Override
    public void onHostDestroy() {
        Log.d(getName(), "onHostDestroy");
        if (_publishedMessage != null) _messagesClient.unpublish(_publishedMessage);
        if (_isSubscribed) _messagesClient.unsubscribe(_listener);
        // TODO: Additional cleanup? Is BLE now disabled? who knows
    }

    @Override
    public void onCatalystInstanceDestroy() {
        Log.d(getName(), "onCatalystInstanceDestroy");
    }

    @Override
    public String getName() {
        return "GoogleNearbyMessages";
    }
}
