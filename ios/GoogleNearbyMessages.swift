//
//  GoogleNearbyMessages.swift
//  GoogleNearbyMessages
//
//  Created by Marc Rousavy on 02.06.20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import CoreBluetooth

@objc(NearbyMessages)
class NearbyMessages: RCTEventEmitter {
	enum EventType: String, CaseIterable {
		case MESSAGE_FOUND
		case MESSAGE_LOST
		case BLUETOOTH_ERROR
		case PERMISSION_ERROR
		case MESSAGE_NO_DATA_ERROR
		case UNSUPPORTED_ERROR
	}
	enum GoogleNearbyMessagesError: Error, LocalizedError {
		case permissionError(permissionName: String)
		case runtimeError(message: String)

		public var errorDescription: String? {
			switch self {
			case .permissionError(permissionName: let permissionName):
				return "Permission has been denied! Denied Permission: \(permissionName). Make sure to include NSBluetoothPeripheralUsageDescription in your Info.plist!"
			case .runtimeError(message: let message):
				return message
			}
		}
	}


	private var messageManager: GNSMessageManager? = nil
	private var currentPublication: GNSPublication? = nil
	private var currentSubscription: GNSSubscription? = nil
	// workaround objects for checkBluetoothAvailability
	private var tempBluetoothManager: CBCentralManager? = nil
	private var tempBluetoothManagerDelegate: CBCentralManagerDelegate? = nil
	private var didCallback = false

	@objc(connect:resolver:rejecter:)
	func connect(_ apiKey: String, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
		print("GNM_BLE: Connecting...")
		//GNSMessageManager.setDebugLoggingEnabled(true)

		self.messageManager = GNSMessageManager(apiKey: apiKey,
												paramsBlock: { (params: GNSMessageManagerParams?) in
													guard let params = params else { return }
													params.microphonePermissionErrorHandler = { (hasError: Bool) in
														self.sendEvent(withName: EventType.PERMISSION_ERROR.rawValue, body: [ "hasError": hasError, "message": "Microphone Permission denied!" ]);
													}
													params.bluetoothPowerErrorHandler = { (hasError: Bool) in
														self.sendEvent(withName: EventType.BLUETOOTH_ERROR.rawValue, body: [ "hasError": hasError, "message": "Bluetooth is powered off/unavailable!" ]);
													}
													params.bluetoothPermissionErrorHandler = { (hasError: Bool) in
														self.sendEvent(withName: EventType.PERMISSION_ERROR.rawValue, body: [ "hasError": hasError, "message": "Bluetooth Permission denied!" ]);
													}

		})
		resolve(nil)
	}

	@objc
	func disconnect() -> Void {
		print("GNM_BLE: Disconnecting...")
		// TODO: is setting nil enough garbage collection? no need for CFRetain, CFRelease, or CFAutorelease?
		self.currentSubscription = nil
		self.currentPublication = nil
		self.messageManager = nil
	}

	@objc(publish:resolver:rejecter:)
	func publish(_ message: String, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
		print("GNM_BLE: Publishing...")
		do {
			if (self.messageManager == nil) {
				throw GoogleNearbyMessagesError.runtimeError(message: "Google Nearby Messages is not connected! Call connect() before any other calls.")
			}
			self.currentPublication = self.messageManager!.publication(with: GNSMessage(content: message.data(using: .utf8)),
				paramsBlock: { (params: GNSPublicationParams?) in
					guard let params = params else { return }
					params.strategy = GNSStrategy(paramsBlock: { (params: GNSStrategyParams?) in
						guard let params = params else { return }
						params.discoveryMediums = .BLE
						//params.discoveryMode = .broadcast

					})
			})
			resolve(nil)
		} catch {
			reject("GOOGLE_NEARBY_MESSAGES_ERROR_PUBLISH", error.localizedDescription, error)
		}
	}

	@objc
	func unpublish() -> Void {
		print("GNM_BLE: Unpublishing...")
		self.currentPublication = nil
	}

	@objc(subscribe:rejecter:)
	func subscribe(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
		print("GNM_BLE: Subscribing...")
		do {
			if (self.messageManager == nil) {
				throw GoogleNearbyMessagesError.runtimeError(message: "Google Nearby Messages is not connected! Call connect() before any other calls.")
			}
			self.currentSubscription = self.messageManager!.subscription(
				messageFoundHandler: { (message: GNSMessage?) in
					guard let data = message?.content else {
						self.sendEvent(withName: EventType.MESSAGE_NO_DATA_ERROR.rawValue, body: [ "hasError": true, "message": "Message does not have any Data!" ] )
						return
					}
					print("GNM_BLE: Found message!")
					self.sendEvent(withName: EventType.MESSAGE_FOUND.rawValue, body: [ "message": String(data: data, encoding: .utf8) ]);
				},
				messageLostHandler: { (message: GNSMessage?) in
					guard let data = message?.content else {
						self.sendEvent(withName: EventType.MESSAGE_NO_DATA_ERROR.rawValue, body: [ "hasError": true, "message": "Message does not have any Data!" ] )
						return
					}
					print("GNM_BLE: Lost message!")
					self.sendEvent(withName: EventType.MESSAGE_LOST.rawValue, body: [ "message": String(data: data, encoding: .utf8) ]);
				},
				paramsBlock: { (params: GNSSubscriptionParams?) in
				  guard let params = params else { return }
				  params.strategy = GNSStrategy(paramsBlock: { (params: GNSStrategyParams?) in
					guard let params = params else { return }
					params.discoveryMediums = .BLE
					//params.discoveryMode = .scan
				  })
				})
			resolve(nil)
		} catch {
			reject("GOOGLE_NEARBY_MESSAGES_ERROR_SUBSCRIBE", error.localizedDescription, error)
		}
	}

	@objc
	func unsubscribe() -> Void {
		print("GNM_BLE: Unsubscribing...")
		self.currentSubscription = nil
	}

	@objc(checkBluetoothPermission:rejecter:)
	func checkBluetoothPermission(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
		print("GNM_BLE: Checking Bluetooth Permissions...")
		let hasBluetoothPermission = self.hasBluetoothPermission()
		resolve(hasBluetoothPermission)
	}

	@objc(checkBluetoothAvailability:rejecter:)
	func checkBluetoothAvailability(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
		if (self.tempBluetoothManager != nil || self.tempBluetoothManagerDelegate != nil) {
			let error = GoogleNearbyMessagesError.runtimeError(message: "Another Bluetooth availability check is already in progress!")
			reject("GOOGLE_NEARBY_MESSAGES_CHECKBLUETOOTH_ERROR", error.localizedDescription, error)
			return
		}
		self.didCallback = false
		class BluetoothManagerDelegate : NSObject, CBCentralManagerDelegate {
			private var promiseResolver: RCTPromiseResolveBlock
			private weak var parentReference: NearbyMessages?
			init(resolver: @escaping RCTPromiseResolveBlock, parentReference: NearbyMessages) {
				self.promiseResolver = resolver
				self.parentReference = parentReference
			}
			
			func centralManagerDidUpdateState(_ central: CBCentralManager) {
				guard let parent = parentReference else {
					return
				}
				if (!parent.didCallback) {
					parent.didCallback = true
					print("GNM_BLE: CBCentralManager did update state with \(central.state.rawValue)")
					self.promiseResolver(central.state == .poweredOn)
					parent.tempBluetoothManager = nil
					parent.tempBluetoothManagerDelegate = nil
				}
			}
		}
		tempBluetoothManagerDelegate = BluetoothManagerDelegate(resolver: resolve, parentReference: self)
		tempBluetoothManager = CBCentralManager(delegate: tempBluetoothManagerDelegate, queue: nil)
		
		DispatchQueue.main.asyncAfter(deadline: .now() + .seconds(10)) {
			if (!self.didCallback) {
				self.didCallback = true
				let error = GoogleNearbyMessagesError.runtimeError(message: "The CBCentralManager (Bluetooth) did not power on after 10 seconds. Cancelled execution.")
				reject("GOOGLE_NEARBY_MESSAGES_CHECKBLUETOOTH_TIMEOUT", error.localizedDescription, error)
				self.tempBluetoothManager = nil
				self.tempBluetoothManagerDelegate = nil
			}
		}
	}

	func hasBluetoothPermission() -> Bool {
		if #available(iOS 13.1, *) {
			return CBCentralManager.authorization == .allowedAlways
		} else if #available(iOS 13.0, *) {
			return CBCentralManager().authorization == .allowedAlways
		}
		// Before iOS 13, Bluetooth permissions are not required
		return true
	}

	override func supportedEvents() -> [String]! {
		return EventType.allCases.map { (event: EventType) -> String in
			return event.rawValue
		}
	}

	@objc
	override static func requiresMainQueueSetup() -> Bool {
		// init on background thread
		return false
	}

	// Called when the UIView gets destroyed (e.g. App reload)
	@objc
	func invalidate() {
		print("GNM_BLE: invalidate")
		disconnect()
	}
}
