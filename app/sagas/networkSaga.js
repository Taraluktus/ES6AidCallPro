const {fork, call, apply, take, put} = require("redux-saga/effects");
import * as sagaConstants from "./sagaConstants";


export function* networkSaga(getState) {
	// Erst starten, wenn Cordova "device ready" meldet
	yield take(sagaConstants.CORDOVA_DEVICE_READY);
	/* if (navigator.connection && navigator.connection.type) {
		while (true) {
			let networkState = navigator.connection.type;
			if (networkState === Connection.NONE) {
				if (getState().network.connected)
					yield put({ type: sagaConstants.NETWORK_GOES_OFFLINE, payload: new Date() });
			} else {
				if (!getState().network.connected)
					yield put({ type: sagaConstants.NETWORK_GOES_ONLINE, payload: new Date() });
			}
		}
	} else { */
		yield put({ type: sagaConstants.NETWORK_GOES_ONLINE, payload: new Date() });
	// }
}
