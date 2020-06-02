//
//  GoogleNearbyMessages.swift
//  GoogleNearbyMessages
//
//  Created by Marc Rousavy on 02.06.20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import GNSMessages

@objc(NearbyMessages)
class NearbyMessages: RCTEventEmitter {
	enum EventType: String {
		case MESSAGE_FOUND
		case MESSAGE_LOST
		case BLUETOOTH_ERROR
		case PERMISSION_ERROR
	}
	enum GoogleNearbyMessagesError: Error {
		case runtimeError(String)
	}

	
	private var messageManager: GNSMessageManager = nil
	private var currentPublication = nil
	private var currentSubscription = nil
	
	@objc(constantsToExport)
	public func constantsToExport() -> [AnyHashable : Any]! {
	  return ["initialCount": 0]
	}
	
	@objc
	func connect(apiKey: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
		do {
			// TODO: remove debug logging
			GNSMessageManager.setDebugLoggingEnabled(true)
			
			let hasPermission = GNSPermission.isGranted()
			if (!hasPermission) {
				throw GoogleNearbyMessagesError.runtimeError("BLE Permission denied!")
			}
			
			self.messageManager = GNSMessageManager(APIKey: apiKey,
													paramsBlock: { (params: GNSMessageManagerParams?) in
														guard let params = params else { return }
														params.microphonePermissionErrorHandler = { (hasError: Bool) in
															sendEvent(withName: EventType.PERMISSION_ERROR.rawValue, body: [ "permission": "microphone" ]);
														}
														params.bluetoothPowerErrorHandler = { (hasError: Bool) in
															sendEvent(withName: EventType.BLE_ERROR.rawValue, body: [ "hasError": hasError ]);
														}
														params.bluetoothPermissionErrorHandler = { (hasError: Bool) in
															sendEvent(withName: EventType.PERMISSION_ERROR.rawValue, body: [ "message": "bluetooth" ]);
														}
														params.strategy = GNSStrategy(paramsBlock: { (params: GNSStrategyParams?) in
															guard let params = params else { return }
															// TODO: currently it only supports BLE. Maybe support more?
															params.discoveryMediums = .BLE
														})
			})
			resolve(nil)
		} catch {
			reject(error)
		}
	}
	
	@objc
	func disconnect(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
		self.currentSubscription = nil
		self.currentPublication = nil
		self.messageManager = nil
		resolve(nil)
	}
	
	@objc
	func publish(message: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
		do {
			self.currentPublication = try self.messageManager.publication(with: GNSMessage(content: message.data(using: .utf8)))
			resolve(nil)
		} catch {
			reject(error)
		}
	}
	
	@objc
	func unpublish(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
		self.currentPublication = nil
		resolve(nil)
	}
	
	@objc
	func subscribe(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
		do {
			self.currentSubscription = messageManager.subscription(
				messageFoundHandler: { (message: GNSMessage?) in
					sendEvent(withName: EventType.MESSAGE_FOUND.rawValue, body: [ "message": message ]);
				},
				messageLostHandler: { (message: GNSMessage?) in
				sendEvent(withName: EventType.MESSAGE_LOST.rawValue, body: [ "message": message ]);
				})
			resolve(nil)
		} catch {
			reject(error)
		}
	}
	
	@objc
	func unsubscribe(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
		self.currentSubscription = nil
		resolve(nil)
	}
	
	override func supportedEvents() -> [String]! {
		return ["MESSAGE_FOUND", "MESSAGE_LOST", "BLUETOOTH_ERROR", "PERMISSION_ERROR"]
	}
	
	@objc
	static func requiresMainQueueSetup() -> Bool {
		// init on background thread
		return false
	}
}
