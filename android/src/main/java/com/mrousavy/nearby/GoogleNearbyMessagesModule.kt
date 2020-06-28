package com.mrousavy.nearby

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.messages.*
import java.util.*

val defaultDiscoveryModes = Strategy.DISCOVERY_MODE_BROADCAST or Strategy.DISCOVERY_MODE_SCAN
val defaultDiscoveryMediums = BetterStrategy.DISCOVERY_MEDIUM_BLE
val defaultPermissions = NearbyPermissions.DEFAULT

class GoogleNearbyMessagesModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), LifecycleEventListener {
    private enum class EventType(private val _type: String) {
        MESSAGE_FOUND("MESSAGE_FOUND"),
        MESSAGE_LOST("MESSAGE_LOST"),
        BLUETOOTH_ERROR("BLUETOOTH_ERROR"),
        PERMISSION_ERROR("PERMISSION_ERROR"), // doesn't exist on Android
        MESSAGE_NO_DATA_ERROR("MESSAGE_NO_DATA_ERROR");

        override fun toString(): String {
            return _type
        }
    }

    private var _messagesClient: MessagesClient? = null
    private var _publishedMessage: Message? = null
    private var _isSubscribed = false
    private var _listener: MessageListener? = null
    private var _subscribeOptions: SubscribeOptions? = null
    private var _publishOptions: PublishOptions? = null
    private val isMinimumAndroidVersion: Boolean
        get() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.ICE_CREAM_SANDWICH
    private val context: Context?
        get() = currentActivity


    @ReactMethod
    fun connect(discoveryModes: ReadableArray, discoveryMediums: ReadableArray, promise: Promise) {
        Log.d(name, "GNM_BLE: Connecting...")
        if (!isMinimumAndroidVersion) {
            promise.reject(Exception("UNSUPPORTED_ERROR: Current Android version is too low: ${Build.VERSION.SDK_INT}"))
            return
        }
        if (!isGooglePlayServicesAvailable(true)) {
            promise.reject(Exception("UNSUPPORTED_ERROR: Google Play Services are not available on this device."))
            return
        }
        if (BluetoothAdapter.getDefaultAdapter() == null) {
            promise.reject(Exception("UNSUPPORTED_ERROR: No default Bluetooth adapter could be found."))
            return
        }
        _listener = object : MessageListener() {
            override fun onFound(message: Message) {
                handleOnFound(message)
            }

            override fun onLost(message: Message) {
                handleOnLost(message)
            }
        }
        val mediums = parseDiscoveryMediums(discoveryMediums)
        val modes = parseDiscoveryModes(discoveryModes)
        val permissions = parsePermissionOptions(discoveryMediums)
        _messagesClient = Nearby.getMessagesClient(context!!, MessagesOptions.Builder().setPermissions(permissions).build())
        _messagesClient!!.registerStatusCallback(object : StatusCallback() {
            override fun onPermissionChanged(permissionGranted: Boolean) {
                super.onPermissionChanged(permissionGranted)
                if (!permissionGranted) emitErrorEvent(EventType.PERMISSION_ERROR, "Bluetooth Permission denied!")
            }
        })
        _subscribeOptions = SubscribeOptions.Builder()
                .setStrategy(BetterStrategy.Builder().setDiscoveryMedium(mediums).setDiscoveryMode(modes).setTtlSeconds(Strategy.TTL_SECONDS_INFINITE).build())
                .setCallback(object : SubscribeCallback() {
                    override fun onExpired() {
                        super.onExpired()
                        Log.i(name, "GNM_BLE: No longer subscribing")
                        _isSubscribed = false
                        emitErrorEvent(EventType.BLUETOOTH_ERROR, "Subscribe expired!")
                    }
                }).build()
        _publishOptions = PublishOptions.Builder()
                .setStrategy(BetterStrategy.Builder().setDiscoveryMedium(mediums).setDiscoveryMode(modes).setTtlSeconds(Strategy.TTL_SECONDS_MAX).build())
                .setCallback(object : PublishCallback() {
                    override fun onExpired() {
                        super.onExpired()
                        Log.i(name, "GNM_BLE: No longer publishing")
                        _publishedMessage = null
                        emitErrorEvent(EventType.BLUETOOTH_ERROR, "Publish expired!")
                    }
                }).build()
        _isSubscribed = false
        Log.d(name, "GNM_BLE: Connected with discoveryMediums $mediums, permissions $permissions and discoveryModes $modes!")
        promise.resolve(null)
    }

    @ReactMethod
    fun disconnect() {
        if (_messagesClient != null) {
            if (_isSubscribed) _messagesClient!!.unsubscribe(_listener!!)
            if (_publishedMessage != null) _messagesClient!!.unpublish(_publishedMessage!!)
        }
        _listener = null
        _subscribeOptions = null
        _publishOptions = null
        _isSubscribed = false
        _publishedMessage = null
        _messagesClient = null
    }

    @ReactMethod
    fun subscribe(promise: Promise) {
        Log.d(name, "GNM_BLE: Subscribing...")
        if (_messagesClient != null) {
            if (_isSubscribed) {
                promise.reject(Exception("An existing callback is already subscribed to the Google Nearby Messages API! Please unsubscribe before subscribing again!"))
            } else {
                _messagesClient!!.subscribe(_listener!!, _subscribeOptions!!).addOnCompleteListener { task ->
                    Log.d(name, "GNM_BLE: Subscribed! Successful: ${task.isSuccessful}")
                    if (task.isSuccessful) {
                        _isSubscribed = true
                        promise.resolve(null)
                    } else {
                        _isSubscribed = false
                        val e = task.exception
                        if (e != null) promise.reject(mapApiException(e))
                        else promise.reject(Exception("The task was not successful, but no Exception was thrown."))
                    }
                }
            }
        } else {
            promise.reject(Exception("The Messages Client was null. Call connect() before using subscribe or publish!"))
        }
    }

    @ReactMethod
    fun unsubscribe(promise: Promise) {
        Log.d(name, "GNM_BLE: Unsubscribing...")
        if (_messagesClient != null) {
            _messagesClient!!.unsubscribe(_listener!!).addOnCompleteListener { task ->
                Log.d(name, "GNM_BLE: Unsubscribed! Successful: ${task.isSuccessful}")
                if (task.isSuccessful) {
                    _isSubscribed = false
                    promise.resolve(null)
                } else {
                    val e = task.exception
                    if (e != null) promise.reject(mapApiException(e))
                    else promise.reject(Exception("The task was not successful, but no Exception was thrown."))
                }
            }
        } else {
            promise.reject(Exception("The Messages Client was null. Did the GoogleNearbyMessagesModule native constructor fail to execute?"))
        }
    }

    @ReactMethod
    fun publish(message: String, promise: Promise) {
        if (_messagesClient != null) {
            if (_publishedMessage != null) {
                promise.reject(Exception("There is an active published message! Call unpublish first!"))
            } else {
                _publishedMessage = Message(message.toByteArray())
                _messagesClient!!.publish(_publishedMessage!!, _publishOptions!!).addOnCompleteListener { task ->
                    Log.d(name, "GNM_BLE: Published! Successful: ${task.isSuccessful}")
                    if (task.isSuccessful) {
                        promise.resolve(null)
                    } else {
                        _publishedMessage = null
                        val e = task.exception
                        if (e != null) promise.reject(mapApiException(e))
                        else promise.reject(Exception("The task was not successful, but no Exception was thrown."))
                    }
                }
            }
        } else {
            promise.reject(Exception("The Messages Client was null. Did the GoogleNearbyMessagesModule native constructor fail to execute?"))
        }
    }

    @ReactMethod
    fun unpublish(promise: Promise) {
        if (_messagesClient != null) {
            if (_publishedMessage != null) {
                _messagesClient!!.unpublish(_publishedMessage!!).addOnCompleteListener { task ->
                    Log.d(name, "GNM_BLE: Unpublished! Successful: ${task.isSuccessful}")
                    if (task.isSuccessful) {
                        _publishedMessage = null
                        promise.resolve(null)
                    } else {
                        val e = task.exception
                        if (e != null) promise.reject(mapApiException(e))
                        else promise.reject(Exception("The task was not successful, but no Exception was thrown."))
                    }
                }
            }
        } else {
            promise.reject(Exception("The Messages Client was null. Did the GoogleNearbyMessagesModule native constructor fail to execute?"))
        }
    }

    @ReactMethod
    fun checkBluetoothPermission(promise: Promise) {
        val granted = ContextCompat.checkSelfPermission(reactApplicationContext, Manifest.permission.BLUETOOTH) == PackageManager.PERMISSION_GRANTED
        val grantedAdmin = ContextCompat.checkSelfPermission(reactApplicationContext, Manifest.permission.BLUETOOTH_ADMIN) == PackageManager.PERMISSION_GRANTED
        promise.resolve(granted && grantedAdmin)
    }

    @ReactMethod
    fun checkBluetoothAvailability(promise: Promise) {
        val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
        if (bluetoothAdapter == null) {
            promise.resolve(false)
        } else {
            val isPlayServicesAvailable = isGooglePlayServicesAvailable(true)
            promise.resolve(isPlayServicesAvailable && isMinimumAndroidVersion)
        }
    }

    // Google Nearby Messages API Callbacks
    fun handleOnFound(message: Message) {
        if (message.content != null) {
            val messageString = String(message.content)
            Log.d(name, "GNM_BLE: Found message: $messageString")
            emitMessageEvent(EventType.MESSAGE_FOUND, messageString)
        } else {
            emitMessageEvent(EventType.MESSAGE_NO_DATA_ERROR, "message has no data!")
        }
    }

    fun handleOnLost(message: Message) {
        if (message.content != null) {
            val messageString = String(message.content)
            Log.d(name, "GNM_BLE: Lost message: $messageString")
            emitMessageEvent(EventType.MESSAGE_LOST, messageString)
        } else {
            emitMessageEvent(EventType.MESSAGE_NO_DATA_ERROR, "message has no data!")
        }
    }

    private fun isGooglePlayServicesAvailable(showErrorDialog: Boolean): Boolean {
        val googleApi = GoogleApiAvailability.getInstance()
        val availability = googleApi.isGooglePlayServicesAvailable(context)
        val result = availability == ConnectionResult.SUCCESS
        if (!result &&
                showErrorDialog &&
                googleApi.isUserResolvableError(availability)) {
            googleApi.getErrorDialog(currentActivity, availability, PLAY_SERVICES_RESOLUTION_REQUEST).show()
        }
        return result
    }

    // React Native Lifecycle Methods
    override fun onHostResume() {
        Log.d(name, "GNM_BLE: onHostResume")
        // TODO: On Host Resume? I think the Nearby API automatically manages this using the context
    }

    override fun onHostPause() {
        Log.d(name, "GNM_BLE: onHostPause")
        // TODO: On Host Pause? I think the Nearby API automatically manages this using the context
    }

    override fun onHostDestroy() {
        Log.d(name, "GNM_BLE: onHostDestroy")
        // TODO: Does this fire twice? (Because of onCatalystInstanceDestroy, and maybe Nearby API onHostDestroy...)
        disconnect()
    }

    override fun onCatalystInstanceDestroy() {
        Log.d(name, "GNM_BLE: onCatalystInstanceDestroy")
        disconnect()
    }

    override fun getName(): String {
        return "GoogleNearbyMessages"
    }

    private fun mapApiException(e: Exception): Exception {
        val apiException = if (e is ApiException) e else null
        return if (apiException != null) {
            val descriptor = errorCodeToDescriptor(apiException.statusCode)
            Exception(apiException.statusCode.toString() + ": " + descriptor + ". See: https://developers.google.com/android/reference/com/google/android/gms/nearby/messages/NearbyMessagesStatusCodes")
        } else {
            e
        }
    }

    /**
     * Map API error code to descriptor - See: https://developers.google.com/android/reference/com/google/android/gms/nearby/messages/NearbyMessagesStatusCodes
     * @param errorCode The code to map.
     * @return A descriptor for the error code. Or null.
     */
    private fun errorCodeToDescriptor(errorCode: Int): String {
        return when (errorCode) {
            2802 -> "APP_NOT_OPTED_IN"
            2804 -> "APP_QUOTA_LIMIT_REACHED"
            2821 -> "BLE_ADVERTISING_UNSUPPORTED"
            2822 -> "BLE_SCANNING_UNSUPPORTED"
            2820 -> "BLUETOOTH_OFF"
            2803 -> "DISALLOWED_CALLING_CONTEXT"
            2806 -> "FORBIDDEN"
            2807 -> "MISSING_PERMISSIONS"
            2805 -> "NOT_AUTHORIZED"
            2801 -> "TOO_MANY_PENDING_INTENTS"
            else -> "UNKNOWN_ERROR"
        }
    }

    private fun parseDiscoveryModes(discoveryModes: ReadableArray): Int {
        var discoveryMode = 0
        val list = discoveryModes.toArrayList()
        if (list.size == 0) return defaultDiscoveryModes

        for (mode in list) {
            val modeLower = mode.toString().toLowerCase(Locale.ROOT)
            when (modeLower) {
                "broadcast" -> discoveryMode = discoveryMode or Strategy.DISCOVERY_MODE_BROADCAST
                "scan" -> discoveryMode = discoveryMode or Strategy.DISCOVERY_MODE_SCAN
            }
        }
        return discoveryMode
    }

    // TODO: I don't know if that's parsing the right values. There are no docs for this.
    // TODO: Strategy.java has zze() which maps BLE-only to 2. But are the other ones correct? Ultrasound is 4, here it is 6??
    private fun parseDiscoveryMediums(discoveryMediums: ReadableArray): Int {
        var discoveryMedium = 0
        val list = discoveryMediums.toArrayList()
        if (list.size == 0) return defaultDiscoveryMediums

        for (medium in list) {
            val mediumLower = medium.toString().toLowerCase(Locale.ROOT)
            when (mediumLower) {
                "ble" -> discoveryMedium = discoveryMedium or BetterStrategy.DISCOVERY_MEDIUM_BLE
                "audio" ->  discoveryMedium = discoveryMedium or BetterStrategy.DISCOVERY_MEDIUM_AUDIO
                // only supported on android, these are not tested!!
                "bluetooth" -> discoveryMedium = discoveryMedium or NearbyPermissions.BLUETOOTH
                "default" ->  discoveryMedium = discoveryMedium or BetterStrategy.DISCOVERY_MEDIUM_DEFAULT
                "none" ->  discoveryMedium = discoveryMedium or NearbyPermissions.NONE
            }
        }
        return discoveryMedium
    }

    private fun parsePermissionOptions(discoveryMediums: ReadableArray): Int {
        var permissions = 0
        val list = discoveryMediums.toArrayList()
        if (list.size == 0) return defaultPermissions

        for (medium in list) {
            val mediumLower = medium.toString().toLowerCase(Locale.ROOT)
            when (mediumLower) {
                "ble" -> permissions = permissions or NearbyPermissions.BLE
                "audio" ->  permissions = permissions or NearbyPermissions.MICROPHONE
                // only supported on android, these are not tested!!
                "bluetooth" -> permissions = permissions or NearbyPermissions.BLUETOOTH
                "default" ->  permissions = permissions or NearbyPermissions.DEFAULT
                "none" ->  permissions = permissions or NearbyPermissions.NONE
            }
        }
        return permissions
    }

    // React Native Event Emitters
    private fun emitMessageEvent(event: EventType, message: String) {
        val params = Arguments.createMap()
        params.putString("message", message)
        val context = reactApplicationContext
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(event.toString(), params)
    }

    private fun emitErrorEvent(event: EventType, message: String?) {
        val params = Arguments.createMap()
        if (message != null) {
            params.putString("message", message)
        }
        val context = reactApplicationContext
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(event.toString(), params)
    }

    companion object {
        private const val PLAY_SERVICES_RESOLUTION_REQUEST = 9000
    }

    init {
        reactContext.addLifecycleEventListener(this)
    }
}
