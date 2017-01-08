import {createSelector} from "reselect";


const getRemainingTestAlarms = (state) => state.user.options.remainingTestAlarms;
const getAlarmFired = (state) => state.alarm.alarmFired;
const getAlarmActive = (state) => state.alarm.alarmActive;
const getTestAlarmFired = (state) => state.alarm.testAlarmFired;
const getTestAlarmActive = (state) => state.alarm.testAlarmActive;
const getPersonsInAlarmRange = (state) => state.alarm.personsInAlarmRange;
const getPersonsConfirmed = (state) => state.alarm.personsConfirmed;
const getConfirmedConfirmRequest = (state) => state.alarm.confirmedConfirmRequest;
const getConfirmedTestConfirmRequest = (state) => state.alarm.confirmedTestConfirmRequest;
const getDistanceToAlarmer = (state) => state.alarm.distanceToAlarmer;
const getAddressOfAlarmer = (state) => state.alarm.addressOfAlarmer;
const getDistanceToLastConfirmer = (state) => state.alarm.distanceToLastConfirmer;


export const isAlarmActive = createSelector(
	getAlarmFired, getAlarmActive, getTestAlarmFired, getTestAlarmActive,
	(alarmFired, alarmActive, testAlarmFired, testAlarmActive) => {
		if (!alarmFired && !alarmActive && !testAlarmFired && !testAlarmActive)
			return false;
		return true;
	}
);

export const isTestAlarmPossible = createSelector(
	isAlarmActive, getRemainingTestAlarms,
	(alarmActive, remainingTestAlarms) => {
		if (!alarmActive && remainingTestAlarms > 0)
			return true;
		return false;
	}
);

export const isConfirmActive = createSelector(
	getConfirmedConfirmRequest, getConfirmedTestConfirmRequest,
	(confirmedConfirmRequest, confirmedTestConfirmRequest) => {
		if (confirmedConfirmRequest || confirmedTestConfirmRequest)
			return true;
		return false;
	}
);

export const isAlarmRunning = createSelector(
	getAlarmActive, getTestAlarmActive,
	(alarmActive, testAlarmActive) => {
		if (alarmActive || testAlarmActive)
			return true;
		return false;
	}
);

export const getDistance = createSelector(
	isConfirmActive, getDistanceToAlarmer,
	(confirmActive, distanceToAlarmer) => {
		if (!confirmActive)
			return "0";
		if (distanceToAlarmer)
			return distanceToAlarmer;
		return "0";
	}
);

export const getAddress = createSelector(
	isConfirmActive, getAddressOfAlarmer,
	(confirmActive, addressOfAlarmer) => {
		if (!confirmActive)
			return "-";
		if (addressOfAlarmer) {
			console.error(addressOfAlarmer);
			// Alles ab dem ersten Komma entfernen
			let newAddr = addressOfAlarmer.split(",")[0];
			return newAddr;
		}
		return "-";
	}
);

export const getNumberOfConfirmed = createSelector(
	isAlarmRunning, getPersonsConfirmed,
	(alarmRunning, personsConfirmed) => {
		if (!alarmRunning)
			return "-";
		if (personsConfirmed)
			return personsConfirmed;
		return "0";
	}
);

export const getDistanceOfLastConfirmer = createSelector(
	isAlarmRunning, getDistanceToLastConfirmer,
	(alarmRunning, distanceToLastConfirmer) => {
		if (!alarmRunning)
			return "-";
		if (distanceToLastConfirmer)
			return distanceToLastConfirmer;
		return "0";
	}
);

export const getPersonsAlarmRange = createSelector(
	isAlarmRunning, getPersonsInAlarmRange,
	(alarmRunning, personsInAlarmRange) => {
		if (!alarmRunning)
			return "-";
		if (personsInAlarmRange)
			return personsInAlarmRange;
		return "0";
	}
);
