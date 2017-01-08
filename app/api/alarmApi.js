import {Push, Device} from "ionic-native";
import {SERVER_URL, checkStatus, parseJSON} from "./fetchUtils";
const moment = require("moment");
export const CONFIG_ALARM_MINIMALTIMEBETWEEN = 5 * 60 * 1000;


export function initPush() {
	Push.hasPermission().then(({isEnabled}) => {
		if (!isEnabled) {
			console.error("Keine Berechtigung für Push erhalten!");
			return null;
		} else {
			// Berechtigung erhalten, nun einrichten
			return Push.init({
				android: {
					senderID: "621278688426",
					sound: true,
					vibrate: true,
					clearNotifications: true,
					forceShow: true
				},
				ios: {
					senderID: undefined,
					alert: true,
					badge: true,
					sound: true,
					clearBadge: true
				},
				"windows": {}
			});
		}
	})
		.catch((reason) => {
			console.error("Push-Init fehlgeschlagen", reason);
			return null;
		});
}

export function onPush(push, onRegistration, onNotification, onUnregister) {
	push.on("registration", (data) => {
		onRegistration(data.registrationId);
		push.finish();
	});
	push.on("notification", (data) => {
		onNotification(data);
		push.finish();
	});
	push.on("unregister", () => {
		onUnregister();
		push.finish();
	}, () => {
		console.error("Fehler beim De-Registrieren aufgetreten!");
		push.finish();
	});
}

export function submitRegistrationId(token, regId) {
	let agent;
	if (Device.device.platform === "iOS") {
		agent = "ios";
	} else if ((Device.device.platform === "Android") || (Device.device.platform === "amazon-fireos")) {
		agent = "android";
	} else if (Device.device.platform.startsWith("windows")) {
		agent = "windows";
	}
	return fetch(`${SERVER_URL}api/installations?access_token=${token}`, {
    method: "POST",
    mode: "cors",
    credentials: "include",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
			appId: "aidcall-push-app",
			userId: token,
			deviceToken: regId,
			deviceType: agent
		})
  })
    .then(checkStatus)
    .then(parseJSON)
    .then(data => data);
}


export function onAlarmSocket(socket, onAlarmStart, onTestAlarmStart, onAlarmStop, onConfirmed) {
  socket.on("alarm", (rawData) => {
    onAlarmStart(rawData);
  });
  socket.on("testalarm", (rawData) => {
    onTestAlarmStart(rawData);
  });
  socket.on("alarmstopped", onAlarmStop);
  socket.on("gotconfirm", (rawData) => {
    onConfirmed(rawData);
  });
}


export function alarm(token) {
	return fetch(`${SERVER_URL}api/Angels/alarm?access_token=${token}`, {
    method: "GET",
    mode: "cors",
    credentials: "include"
  })
    .then(checkStatus)
    .then(parseJSON)
    .then(data => data);
}

export function testAlarm(token) {
	return fetch(`${SERVER_URL}api/Angels/testalarm?access_token=${token}`, {
    method: "GET",
    mode: "cors",
    credentials: "include"
  })
    .then(checkStatus)
    .then(parseJSON)
    .then(data => data);
}


export function stopAlarm(token) {
	return fetch(`${SERVER_URL}api/Angels/stopalarm?access_token=${token}`, {
    method: "GET",
    mode: "cors",
    credentials: "include"
  })
    .then(checkStatus)
    .then(parseJSON)
    .then(data => data);
}


export function confirmAlarm(alarmId, token) {
	console.error("alarmId", JSON.stringify({
      alarmId: alarmId
    }));
	return fetch(`${SERVER_URL}api/Angels/confirmalarm?access_token=${token}`, {
    method: "POST",
    mode: "cors",
    credentials: "include",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      alarmId: alarmId
    })
  })
    .then(checkStatus)
    .then(parseJSON)
    .then(data => data);
}





export function isAlarmStale(alarmCreatedAt) {
	const currentDate = moment();
	const createdAt = moment(alarmCreatedAt);
	const expiresAt = createdAt.add(CONFIG_ALARM_MINIMALTIMEBETWEEN, "milliseconds");
	if (expiresAt.isSameOrBefore(currentDate))
		return true;
	return false;
}


export function alarmExpiresIn(alarmCreatedAt) {
	const currentDate = moment();
	const createdAt = moment(alarmCreatedAt);
	const expiresAt = createdAt.add(CONFIG_ALARM_MINIMALTIMEBETWEEN, "milliseconds");
	const duration = moment.duration(expiresAt.diff(currentDate));
	return duration.asMilliseconds();
}
