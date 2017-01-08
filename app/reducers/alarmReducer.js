import * as sagaConstants from "../sagas/sagaConstants";


const initialState = {
	dispatch: null,
	pushObject: null,
	// Alarmer-State
	alarmFired: false,
	alarmActive: false,
	alarmActivatedAt: null,
	testAlarmFired: false,
	testAlarmActive: false,
	testAlarmActivatedAt: null,
	personsInAlarmRange: null,
	personsConfirmed: null,
	distanceToLastConfirmer: null,
	// Confirmer-State
	receivedConfirmRequest: false,
	receivedConfirmRequestAt: null,
	confirmedConfirmRequest: false,
	receivedTestConfirmRequest: false,
	receivedTestConfirmRequestAt: null,
	confirmedTestConfirmRequest: false,
	distanceToAlarmer: null,
	addressOfAlarmer: null,
	alarmId: null
};


export default (state = initialState, action) => {
  switch (action.type) {
		case sagaConstants.ALARM_SYSTEM_START:
			return Object.assign({}, state, {
				dispatch: action.payload,
				pushObject: null
			});
		case sagaConstants.ALARM_SYSTEM_STARTED:
			// Hier nichts am State machen
			return state;

		case sagaConstants.ALARM_PUSH_START:
			// Hier nichts am State machen
			return state;
		case sagaConstants.ALARM_PUSH_STARTING:
			// Hier nichts am State machen
			return state;
		case sagaConstants.ALARM_PUSH_START_SUCCESSFUL:
			return Object.assign({}, state, {
				pushObject: action.payload
			});
		case sagaConstants.ALARM_PUSH_START_FAILED:
			return Object.assign({}, state, {
				pushObject: null
			});

		case sagaConstants.ALARM_PUSH_STOP:
			// Hier nichts am State machen
			return state;
		case sagaConstants.ALARM_PUSH_STOPPING:
		// Hier nichts am State machen
		case sagaConstants.ALARM_PUSH_STOP_SUCCESSFUL:
			return Object.assign({}, state, {
				pushObject: null
			});
		case sagaConstants.ALARM_PUSH_STOP_FAILED:
			return Object.assign({}, state, {
				pushObject: null
			});

		case sagaConstants.ALARM_ALARM_FIRE:
			// Hier nichts am State machen
			return state;
		case sagaConstants.ALARM_ALARM_FIRING:
			return Object.assign({}, state, {
				alarmFired: true
			});
		case sagaConstants.ALARM_ALARM_FIRE_SUCCESSFUL:
			console.error(action.payload);
			return Object.assign({}, state, {
				alarmFired: false,
				alarmActive: true,
				alarmActivatedAt: action.payload.activatedAt,
				personsInAlarmRange: action.payload.personsInAlarmRange,
				personsConfirmed: 0,
				distanceToLastConfirmer: null
			});
		case sagaConstants.ALARM_ALARM_FIRE_FAILED:
			return Object.assign({}, initialState, {
				dispatch: state.dispatch,
				pushObject: state.pushObject
			});

		case sagaConstants.ALARM_TESTALARM_FIRE:
			// Hier nichts am State machen
			return state;
		case sagaConstants.ALARM_TESTALARM_FIRING:
			return Object.assign({}, state, {
				testAlarmFired: true
			});
		case sagaConstants.ALARM_TESTALARM_FIRE_SUCCESSFUL:
			return Object.assign({}, state, {
				testAlarmFired: false,
				testAlarmActive: true,
				testAlarmActivatedAt: action.payload.activatedAt,
				personsInAlarmRange: action.payload.personsInAlarmRange,
				personsConfirmed: 0,
				distanceToLastConfirmer: null
			});
		case sagaConstants.ALARM_TESTALARM_FIRE_FAILED:
			return Object.assign({}, initialState, {
				dispatch: state.dispatch,
				pushObject: state.pushObject
			});

		case sagaConstants.ALARM_ALARM_STOP:
			// Hier nichts am State machen
			return state;
		case sagaConstants.ALARM_ALARM_STOPPPING:
			// Hier aktuell nichts am State machen
			return state;
		case sagaConstants.ALARM_ALARM_STOP_SUCCESSFUL:
		case sagaConstants.ALARM_ALARM_STOP_FAILED:
			return Object.assign({}, initialState, {
				dispatch: state.dispatch,
				pushObject: state.pushObject
			});

		case sagaConstants.ALARM_GOTCONFIRMED_RAW:
			// Hier nichts am State machen
			// Der Payload wird direkt weiterverarbeitet und kommt erst mit ALARM_GOTCONFIRMED in den State
			return state;
		case sagaConstants.ALARM_GOTCONFIRMED: {
			// Anzahl der Confirmer erhöhen
			let numConfirmers;
			if (state.personsConfirmed) {
				numConfirmers = state.personsConfirmed + 1;
			} else {
				numConfirmers = 1;
			}
			return Object.assign({}, state, {
				personsConfirmed: numConfirmers,
				distanceToLastConfirmer: action.payload.distance
			});
		}



		case sagaConstants.ALARM_GOTALARM_RAW:
			// Hier nichts am State machen, Payload wird weiterverarbeitet
			return state;
		case sagaConstants.ALARM_GOTALARM:
			// Nur, wenn momentan kein Alarm aktiv ist!
			if (!state.alarmActive && !state.alarmFired && !state.testAlarmActive && !state.testAlarmFired
				&& !state.receivedConfirmRequest && !state.receivedTestConfirmRequest) {
				return Object.assign({}, initialState, {
					dispatch: state.dispatch,
					pushObject: state.pushObject,
					receivedConfirmRequest: true,
					receivedConfirmRequestAt: action.payload.receivedAt,
					distanceToAlarmer: action.payload.distance,
					addressOfAlarmer: action.payload.address,
					alarmId: action.payload.alarmId
				});
			}
			return state;
		case sagaConstants.ALARM_GOTTESTALARM_RAW:
			// Hier nichts am State machen, Payload wird weiterverarbeitet
			return state;
		case sagaConstants.ALARM_GOTTESTALARM:
			// Nur, wenn momentan kein Alarm aktiv ist!
			if (!state.alarmActive && !state.alarmFired && !state.testAlarmActive && !state.testAlarmFired
				&& !state.receivedConfirmRequest && !state.receivedTestConfirmRequest) {
				return Object.assign({}, initialState, {
					dispatch: state.dispatch,
					pushObject: state.pushObject,
					receivedTestConfirmRequest: true,
					receivedTestConfirmRequestAt: action.payload.receivedAt,
					distanceToAlarmer: action.payload.distance,
					addressOfAlarmer: action.payload.address,
					alarmId: action.payload.alarmId
				});
			}
			return state;
		case sagaConstants.ALARM_GOTALARM_STOP_RAW:
			// Hier nichts am State machen, Payload wird weiterverarbeitet
			return state;
		case sagaConstants.ALARM_CONFIRMER_ALARM_STOPPED:
			// Der Alarmer hat den Alarm beendet, alles wieder auf 0 setzen
			return Object.assign({}, initialState, {
				dispatch: state.dispatch,
				pushObject: state.pushObject
			});

		case sagaConstants.ALARM_CONFIRM:
		case sagaConstants.ALARM_CONFIRMING:
			// Hier nichts am State machen
			return state;
		case sagaConstants.ALARM_CONFIRM_SUCCESSFUL:
			return Object.assign({}, state, {
				receivedConfirmRequest: true,
				confirmedConfirmRequest: true
			});
		case sagaConstants.ALARM_CONFIRM_FAILED:
			// Alles zurücksetzen
			return Object.assign({}, initialState, {
				dispatch: state.dispatch,
				pushObject: state.pushObject
			});

		case sagaConstants.ALARM_TESTCONFIRM:
		case sagaConstants.ALARM_TESTCONFIRMING:
			// Hier nichts am State machen
			return state;
		case sagaConstants.ALARM_TESTCONFIRM_SUCCESSFUL:
			return Object.assign({}, state, {
				receivedTestConfirmRequest: true,
				confirmedTestConfirmRequest: true
			});


		case sagaConstants.ALARM_CONFIRM_DENY_OR_STALE:
			// Confirm abgelehnt oder abgelaufen
			return Object.assign({}, initialState, {
				dispatch: state.dispatch,
				pushObject: state.pushObject
			});


		default:
			return state;
	}
};
