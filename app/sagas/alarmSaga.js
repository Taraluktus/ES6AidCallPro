const {fork, call, take, put, race} = require("redux-saga/effects");
import * as sagaConstants from "./sagaConstants";
import {Device} from "ionic-native";
import * as alarmApi from "../api/alarmApi";
import * as alarmSelector from "../selectors/alarmSelector";
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


export function* alarmInitSaga(getState) {
	// Erst starten, wenn Cordova "device ready" meldet
	yield take(sagaConstants.CORDOVA_DEVICE_READY);
	// Erst starten, wenn der Befehl zum Initialisieren des Alarm-Systems kommt
	yield take(sagaConstants.ALARM_SYSTEM_START);
	yield put({ type: sagaConstants.ALARM_SYSTEM_STARTED });

	while (true) {
		// Wenn der User erfolgreich angemeldet und online ist, Push initialisieren
		// Wenn wir nicht im Browser sind, die Push-Engine starten
		const userAction = yield take([sagaConstants.USER_UPDATE_REQUEST_SUCCESSFUL,
			sagaConstants.USER_UPDATE_REQUEST_FAILED]);
		if (userAction.type === sagaConstants.USER_UPDATE_REQUEST_SUCCESSFUL) {
			yield put({ type: sagaConstants.ALARM_PUSH_START });
		} else {
			yield put({ type: sagaConstants.ALARM_PUSH_STOP });
		}
	}
}


export function* alarmPushInitSaga(getState) {
	// Erst starten, wenn Alarm-System gestartet ist
	yield take(sagaConstants.ALARM_SYSTEM_STARTED);

	// Die Saga nur starten, wenn wir nicht im Browser sind
	let pf = Device.device.platform;
	if (pf && ((pf === "Android") || (pf === "iOS") || (pf.startsWith("windows")))) {
		while (true) {
			const pushAction = yield take([sagaConstants.ALARM_PUSH_START, sagaConstants.ALARM_PUSH_STOP]);
			if (pushAction.type === sagaConstants.ALARM_PUSH_START) {
				// Push starten
				// yield fork(doPushInit, )
			} else {
				// Push stoppen
			}
		}
	}
}


export function* alarmSocketInitSaga(getState) {
	// Erst starten, wenn das Alarm-System an sich gestartet ist
	yield take(sagaConstants.ALARM_SYSTEM_STARTED);

	while (true) {
		const socketAction = yield take([sagaConstants.SOCKET_SUBMIT_USERID_SUCCESSFUL,
			sagaConstants.SOCKET_STOP_REQUEST_SUCCESSFUL]);
		if (socketAction.type === sagaConstants.SOCKET_SUBMIT_USERID_SUCCESSFUL) {
			// Socket aktiv!
			// Listener einrichten
			// Wir können davon ausgehen, dass folgende beide Variablen initialisiert sind!
			const {socket} = getState().socket;
			const {dispatch} = getState().alarm;
			yield alarmApi.onAlarmSocket(socket,
				(rawPayload) => { dispatch({ type: sagaConstants.ALARM_GOTALARM_RAW, payload: rawPayload }); },
				(rawPayload) => { dispatch({ type: sagaConstants.ALARM_GOTTESTALARM_RAW, payload: rawPayload }); },
				(rawPayload) => { dispatch({ type: sagaConstants.ALARM_GOTALARM_STOP_RAW }); },
				(rawPayload) => { dispatch({ type: sagaConstants.ALARM_GOTCONFIRMED_RAW, payload: rawPayload }); }
			);
		} else {
			// Socket nicht aktiv!
			// Hier brauchen wir aktuell nichts machen, da die Listener automatisch erlöschen,
			// sobald der Socket nicht mehr aktiv ist
		}
	}
}


export function* alarmProcessRawPayloads(getState) {
	// Erst starten, wenn Alarm-System gestartet ist
	yield take(sagaConstants.ALARM_SYSTEM_STARTED);

	while (true) {
		const rawAction = yield take([sagaConstants.ALARM_GOTALARM_RAW, sagaConstants.ALARM_GOTTESTALARM_RAW,
			sagaConstants.ALARM_GOTALARM_STOP_RAW, sagaConstants.ALARM_GOTCONFIRMED_RAW]);
		switch (rawAction.type) {
			case sagaConstants.ALARM_GOTALARM_RAW:
				yield fork(doProcessRawGotAlarm, rawAction.payload);
				break;
			case sagaConstants.ALARM_GOTTESTALARM_RAW:
				yield fork(doProcessRawGotTestAlarm, rawAction.payload);
				break;
			case sagaConstants.ALARM_GOTALARM_STOP_RAW:
				// Hier geben wir den Alarm-Stop einfach weiter
				yield put({ type: sagaConstants.ALARM_CONFIRMER_ALARM_STOPPED });
				break;
			case sagaConstants.ALARM_GOTCONFIRMED_RAW:
				yield fork(doProcessRawGotConfirmed, rawAction.payload);
				break;
			default:
				break;
		}
	}
}

function* doProcessRawGotAlarm(rawPayload) {
	const payloadArray = rawPayload.split("\n");
	const distance = payloadArray[1];
  const address = payloadArray[2];
  const alarmId = payloadArray[3];
	// Daten vollständig?
	if (distance && address && alarmId) {
		const payload = {
			distance: distance,
			address: address,
			alarmId: alarmId,
			receivedAt: new Date()
		};
		yield put({ type: sagaConstants.ALARM_GOTALARM, payload: payload });
	}
}

function* doProcessRawGotTestAlarm(rawPayload) {
	const payloadArray = rawPayload.split("\n");
	const distance = payloadArray[1];
	const address = payloadArray[2];
	const alarmId = payloadArray[3];
	// Daten vollständig?
	if (distance && address && alarmId) {
		const payload = {
			distance: distance,
			address: address,
			alarmId: alarmId,
			receivedAt: new Date()
		};
		yield put({ type: sagaConstants.ALARM_GOTTESTALARM, payload: payload });
	}
}

function* doProcessRawGotConfirmed(rawPayload) {
	const payloadArray = rawPayload.split("\n");
	const distance = payloadArray[1];
	// Daten vollständig?
	if (distance) {
		const payload = {
			distance: distance
		};
		yield put({ type: sagaConstants.ALARM_GOTCONFIRMED, payload: payload });
	}
}




export function* watchAlarmFiredSaga(getState) {
	// Erst starten, wenn Alarm-System gestartet ist
	yield take(sagaConstants.ALARM_SYSTEM_STARTED);

	while (true) {
		const startAlarmAction = yield take([sagaConstants.ALARM_ALARM_FIRE, sagaConstants.ALARM_TESTALARM_FIRE]);
		if (startAlarmAction.type === sagaConstants.ALARM_ALARM_FIRE) {
			// Alarm
			// Besteht schon ein aktiver Alarm oder Confirm?
			if (!alarmSelector.isAlarmActive(getState()) && !alarmSelector.isConfirmActive(getState())) {
				// Alles i.O., Alarm kann an Server geschickt werden
				yield fork(doFireAlarm, getState().user.token);
				// Auf Erfolg oder Fehler warten
				const fireAlarmAction =
					yield take([sagaConstants.ALARM_ALARM_FIRE_SUCCESSFUL, sagaConstants.ALARM_ALARM_FIRE_FAILED]);
				if (fireAlarmAction.type === sagaConstants.ALARM_ALARM_FIRE_SUCCESSFUL) {
					// Alarm wurde erfolgreich ausgelöst
					// Aktualisierungen auslösen
					yield put({ type: sagaConstants.USER_OPTIONS_LOAD_REQUEST });
					yield put({ type: sagaConstants.LOCATION_NEARBY_REQUEST });
				}
			} else {
				// Aktuell kein Alarm möglich!
				yield put({
					type: sagaConstants.ALARM_ALARM_FIRE_FAILED,
					error: new Error("Alarm oder Confirm schon aktiv!")
				});
			}
		} else {
			// Test-Alarm
			// Besteht schon ein aktiver Alarm oder Confirm, und ist ein Test-Alarm möglich?
			if (!alarmSelector.isAlarmActive(getState()) && !alarmSelector.isConfirmActive(getState()) &&
				alarmSelector.isTestAlarmPossible(getState())) {
				// Alles i.O., Alarm kann an Server geschickt werden
				yield fork(doFireTestAlarm, getState().user.token);
				// Auf Erfolg oder Fehler warten
				const fireTestAlarmAction =
					yield take([sagaConstants.ALARM_TESTALARM_FIRE_SUCCESSFUL, sagaConstants.ALARM_TESTALARM_FIRE_FAILED]);
				if (fireTestAlarmAction.type === sagaConstants.ALARM_TESTALARM_FIRE_SUCCESSFUL) {
					// Alarm wurde erfolgreich ausgelöst
					// Aktualisierungen auslösen
					yield put({ type: sagaConstants.USER_OPTIONS_LOAD_REQUEST });
					yield put({ type: sagaConstants.LOCATION_NEARBY_REQUEST });
				}
			} else {
				// Aktuell kein Alarm möglich!
				yield put({
					type: sagaConstants.ALARM_TESTALARM_FIRE_FAILED,
					error: new Error("Alarm oder Confirm schon aktiv!")
				});
			}
		}
	}
}

function* doFireAlarm(token) {
	try {
    yield put({ type: sagaConstants.ALARM_ALARM_FIRING });
    const result = yield call(alarmApi.alarm, token);
		yield put({
			type: sagaConstants.ALARM_ALARM_FIRE_SUCCESSFUL,
			payload: {
				activatedAt: new Date(),
				personsInAlarmRange: result.alarmedAngels
			}
		});
  } catch (error) {
		yield put({ type: sagaConstants.ALARM_ALARM_FIRE_FAILED, error: error });
  }
}

function* doFireTestAlarm(token) {
	try {
    yield put({ type: sagaConstants.ALARM_TESTALARM_FIRING });
    const result = yield call(alarmApi.testAlarm, token);
		// Die Eigenschaft "remainingAlarms" ignorieren wir, das holen wir uns später vom Server
		yield put({
			type: sagaConstants.ALARM_TESTALARM_FIRE_SUCCESSFUL,
			payload: {
				activatedAt: new Date(),
				personsInAlarmRange: result.alarmedAngels
			}
		});
  } catch (error) {
		yield put({ type: sagaConstants.ALARM_TESTALARM_FIRE_FAILED, error: error });
  }
}




export function* watchAlarmStoppedSaga(getState) {
	// Erst starten, wenn Alarm-System gestartet ist
	yield take(sagaConstants.ALARM_SYSTEM_STARTED);

	// Erst mal checken, ob es einen aktiven Alarm gibt, dessen Zeit abgelaufen ist
	// Dies ist für den Fall, dass man die App während eines Alarms beendet
	if (alarmSelector.isAlarmActive(getState())) {
		// Ist es ein normaler Alarm?
		if (getState().alarm.alarmActive) {
			// Ist der Alarm zu alt?
			if (alarmApi.isAlarmStale(getState().alarm.alarmActivatedAt)) {
				// Alarm abgelaufen, stoppen
				yield put({ type: sagaConstants.ALARM_ALARM_STOP_SUCCESSFUL });
			} else {
				// Alarm noch aktiv, dann warten wir auf das Ende
				const {manual, timeout} = yield race({
					manual: take(sagaConstants.ALARM_ALARM_STOP),
					timeout: call(delay, alarmApi.alarmExpiresIn(getState().alarm.alarmActivatedAt))
				});
				// Den Alarm beenden
				yield call(doStopAlarm, getState().user.token);
				// Aktualisierungen auslösen
				yield put({ type: sagaConstants.USER_OPTIONS_LOAD_REQUEST });
				yield put({ type: sagaConstants.LOCATION_NEARBY_REQUEST });
			}
		} else if (getState().alarm.testAlarmActive) {
			// Ist der Alarm zu alt?
			if (alarmApi.isAlarmStale(getState().alarm.testAlarmActivatedAt)) {
				// Alarm abgelaufen, stoppen
				yield put({ type: sagaConstants.ALARM_ALARM_STOP_SUCCESSFUL });
			} else {
				// Alarm noch aktiv, dann warten wir auf das Ende
				const {manual, timeout} = yield race({
					manual: take(sagaConstants.ALARM_ALARM_STOP),
					timeout: call(delay, alarmApi.alarmExpiresIn(getState().alarm.testAlarmActivatedAt))
				});
				// Den Alarm beenden
				yield call(doStopAlarm, getState().user.token);
				// Aktualisierungen auslösen
				yield put({ type: sagaConstants.USER_OPTIONS_LOAD_REQUEST });
				yield put({ type: sagaConstants.LOCATION_NEARBY_REQUEST });
			}
		}
	}
	while (true) {
		// Wir warten auf das erfolgreiche  Starten eines Alarms
		const alarmStartAction = yield take([sagaConstants.ALARM_ALARM_FIRE_SUCCESSFUL,
			sagaConstants.ALARM_TESTALARM_FIRE_SUCCESSFUL]);
		// Wir warten nun auf das Ende (manuell oder Zeit abgelaufen)
		const {manual, timeout} = yield race({
			manual: take(sagaConstants.ALARM_ALARM_STOP),
			timeout: call(delay, alarmApi.CONFIG_ALARM_MINIMALTIMEBETWEEN)
		});
		// Nun den Alarm beenden
		yield call(doStopAlarm, getState().user.token);
		// Aktualisierungen auslösen
		yield put({ type: sagaConstants.USER_OPTIONS_LOAD_REQUEST });
		yield put({ type: sagaConstants.LOCATION_NEARBY_REQUEST });
	}
}

function* doStopAlarm(token) {
	try {
		yield put({ type: sagaConstants.ALARM_ALARM_STOPPPING });
		yield call(alarmApi.stopAlarm, token);
		yield put({ type: sagaConstants.ALARM_ALARM_STOP_SUCCESSFUL });
	} catch (error) {
		yield put({ type: sagaConstants.ALARM_ALARM_STOP_FAILED, error: error });
	}
}




export function* watchGotAlarm(getState) {
	// Erst starten, wenn Alarm-System gestartet ist
	yield take(sagaConstants.ALARM_SYSTEM_STARTED);

	while (true) {
		// Auf das Erhalten eines Alarms warten
		const gotAlarmAction = yield take([sagaConstants.ALARM_GOTALARM, sagaConstants.ALARM_GOTTESTALARM]);
		// Nach dem Erhalt entweder auf die Bestätigung, Ablehnung, oder den Ablauf warten
		const {confirm, deny, timeout} = yield race({
			confirm: take([sagaConstants.ALARM_CONFIRM, sagaConstants.ALARM_TESTCONFIRM]),
			deny: take(sagaConstants.ALARM_CONFIRM_DENY_OR_STALE),
			timeout: call(delay, alarmApi.CONFIG_ALARM_MINIMALTIMEBETWEEN)
		});
		if (timeout) {
			// Wenn die Zeit abgelaufen ist, dann beenden wir die Confirm-Anfrage manuell
			yield put({ type: sagaConstants.ALARM_CONFIRM_DENY_OR_STALE });
		} else if (deny) {
			// User hat abgelehnt, dann nichts machen
		} else if (confirm) {
			const {alarmId} = gotAlarmAction.payload;
			// Normaler Alarm oder Test-Alarm?
			if (confirm.type === sagaConstants.ALARM_CONFIRM) {
				yield call(doConfirmAlarm, alarmId, getState().user.token);
			} else if (confirm.type === sagaConstants.ALARM_TESTCONFIRM) {
				yield call(doConfirmTestAlarm, alarmId, getState().user.token);
			}
			// Aktualisierungen auslösen
			yield put({ type: sagaConstants.USER_OPTIONS_LOAD_REQUEST });
			yield put({ type: sagaConstants.LOCATION_NEARBY_REQUEST });
		}
	}
}


function* doConfirmAlarm(alarmId, token) {
	try {
		yield put({ type: sagaConstants.ALARM_CONFIRMING });
		yield call(alarmApi.confirmAlarm, alarmId, token);
		yield put({ type: sagaConstants.ALARM_CONFIRM_SUCCESSFUL });
	} catch (error) {
		yield put({ type: sagaConstants.ALARM_CONFIRM_FAILED, error: error });
	}
}

function* doConfirmTestAlarm(alarmId, token) {
	try {
		yield put({ type: sagaConstants.ALARM_TESTCONFIRMING });
		yield call(alarmApi.confirmAlarm, alarmId, token);
		yield put({ type: sagaConstants.ALARM_TESTCONFIRM_SUCCESSFUL });
	} catch (error) {
		yield put({ type: sagaConstants.ALARM_TESTCONFIRM_FAILED, error: error });
	}
}



export function* watchConfirmerAlarmStopped(getState) {
	while (true) {
		yield take([sagaConstants.ALARM_CONFIRMER_ALARM_STOPPED, sagaConstants.ALARM_GOTCONFIRMED,
			sagaConstants.ALARM_GOTALARM_STOP_RAW]);
		yield put({ type: sagaConstants.LOCATION_NEARBY_REQUEST });
	}
}