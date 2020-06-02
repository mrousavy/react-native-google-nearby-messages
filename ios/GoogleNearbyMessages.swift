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
	
	@objc(constantsToExport)
	override public func constantsToExport() -> [AnyHashable : Any]! {
	  return ["initialCount": 0]
	}
	
	@objc(connect:resolver:rejecter:)
	func connect(_ apiKey: String, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
		print("CUSTOM_DEBUG: Connect call...")
		// TODO: remove debug logging
		GNSMessageManager.setDebugLoggingEnabled(true)
		
		self.messageManager = GNSMessageManager(apiKey: apiKey,
												paramsBlock: { (params: GNSMessageManagerParams?) in
													guard let params = params else { return }
													params.microphonePermissionErrorHandler = { (hasError: Bool) in
														self.sendEvent(withName: EventType.PERMISSION_ERROR.rawValue, body: [ "hasError": hasError ]);
													}
													params.bluetoothPowerErrorHandler = { (hasError: Bool) in
														self.sendEvent(withName: EventType.BLUETOOTH_ERROR.rawValue, body: [ "hasError": hasError ]);
													}
													params.bluetoothPermissionErrorHandler = { (hasError: Bool) in
														self.sendEvent(withName: EventType.PERMISSION_ERROR.rawValue, body: [ "hasError": hasError ]);
													}
		})
		resolve(nil)
	}
	
	@objc
	func disconnect() -> Void {
		print("CUSTOM_DEBUG: Disconnect call...")
		self.currentSubscription = nil
		self.currentPublication = nil
		self.messageManager = nil
	}
	
	@objc(publish:resolver:rejecter:)
	func publish(_ message: String, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
		print("CUSTOM_DEBUG: Publish call...")
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
		print("CUSTOM_DEBUG: Unpublish call...")
		self.currentPublication = nil
	}
	
	@objc(subscribe:rejecter:)
	func subscribe(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
		print("CUSTOM_DEBUG: Subscribe call...")
		do {
			if (self.messageManager == nil) {
				throw GoogleNearbyMessagesError.runtimeError(message: "Google Nearby Messages is not connected! Call connect() before any other calls.")
			}
			self.currentSubscription = self.messageManager!.subscription(
				messageFoundHandler: { (message: GNSMessage?) in
					print("CUSTOM_DEBUG: FOUND MESSAGE! \(message)")
					guard let data = message?.content else {
						self.sendEvent(withName: EventType.MESSAGE_NO_DATA_ERROR.rawValue, body: [ "error" : "Message does not have any Data!" ] )
						return
					}
					self.sendEvent(withName: EventType.MESSAGE_FOUND.rawValue, body: [ "message": String(data: data, encoding: .utf8) ]);
				},
				messageLostHandler: { (message: GNSMessage?) in
					print("CUSTOM_DEBUG: LOST MESSAGE! \(message)")
					guard let data = message?.content else {
						self.sendEvent(withName: EventType.MESSAGE_NO_DATA_ERROR.rawValue, body: [ "error" : "Message does not have any Data!" ] )
						return
					}
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
		print("CUSTOM_DEBUG: Unsubscribe call...")
		self.currentSubscription = nil
	}
	
	@objc(checkBluetoothPermission:rejecter:)
	func checkBluetoothPermission(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) -> Void {
		let hasBluetoothPermission = self.hasBluetoothPermission()
		resolve(hasBluetoothPermission)
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
}
