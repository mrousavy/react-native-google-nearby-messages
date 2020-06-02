//
//  GoogleNearbyMessages.swift
//  GoogleNearbyMessages
//
//  Created by Marc Rousavy on 02.06.20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation

@objc(NearbyMessages)
class NearbyMessages: NSObject {
	private var count = 0
	
	@objc(constantsToExport)
	public func constantsToExport() -> [AnyHashable : Any]! {
	  return ["initialCount": 0]
	}
	
	@objc
	func increment() {
		count += 1
		print("count is \(count)")
	}
	
	@objc
	static func requiresMainQueueSetup() -> Bool {
		// init on background thread
		return false
	}
}
