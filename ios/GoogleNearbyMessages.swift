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
class NearbyMessages: NSObject {
	private var count = 0
	
	@objc(constantsToExport)
	public func constantsToExport() -> [AnyHashable : Any]! {
	  return ["initialCount": 0]
	}
	
	@objc
	func connect(apiKey: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> GNSMessageManager {
		let messageManager = GNSMessageManager(APIKey: apiKey)
		return messageManager
	}
	
	// TODO: https://developers.google.com/nearby/messages/ios/pub-sub#swift
	
	@objc
	static func requiresMainQueueSetup() -> Bool {
		// init on background thread
		return false
	}
}
