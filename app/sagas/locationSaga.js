const {takeLatest} = require("redux-saga");
const {fork, call, apply, take, put, race, cancel} = require("redux-saga/effects");
import * as sagaConstants from "./sagaConstants";
import * as locationApi from "../api/locationApi";
import {getLoggedIn} from "../selectors/userSelector";
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));



export function* locationWatchSaga(getState) {
  // Erst starten, wenn Cordova "device ready" meldet
	yield take(sagaConstants.CORDOVA_DEVICE_READY);
  while (true) {
    // Das Starten der Watch wird von außen angestoßen, z.B. in app.ts
    // Wir fangen aber auch das Stoppen auf
    const mainAction = yield take([sagaConstants.LOCATION_WATCH_START, sagaConstants.LOCATION_WATCH_STOP]);
    if (mainAction.type === sagaConstants.LOCATION_WATCH_START) {
      const dispatch = mainAction.payload;
      // Gibt es schon eine Watch im State?
      let {watch} = getState().location;
      // Wir machen nur weiter, wenn es noch keine Watch gibt
      if (!watch) {
        yield fork(doStartWatch);
        // Nun warten wir auf das Ergebnis
        const startWatchAction = yield take([sagaConstants.LOCATION_WATCH_START_SUCCESSFUL,
          sagaConstants.LOCATION_WATCH_START_FAILED]);
        // War es erfolgreich?
        if (!startWatchAction.error) {
          // Dann holen wir uns das Observable
          const newWatch = startWatchAction.payload;
          // Nun subscriben wir das Update
          yield fork(doSubscribeWatch, newWatch, dispatch);
        } else {
          // Nicht erfolgreich, hier nichts tun, und auf die nächste Action warten
        }
      } else {
        console.error("Es gibt schon eine Watch!");
        yield put({ type: sagaConstants.LOCATION_WATCH_START_SUCCESSFUL, payload: watch });
      }
    } else {
      // Watch stoppen
      let {watch} = getState().location;
      if (watch) {
        yield fork(doStopWatch, watch);
      }
    }
  }
}


function* doStartWatch() {
  try {
    const newWatch = yield call(locationApi.startWatch);
    yield put({ type: sagaConstants.LOCATION_WATCH_START_SUCCESSFUL, payload: newWatch });
  } catch (error) {
    yield put({ type: sagaConstants.LOCATION_WATCH_START_FAILED, error: error });
  }
}


function* doStopWatch(watch) {
  try {
    yield call(watch.unsubscribe);
    yield put({ type: sagaConstants.LOCATION_WATCH_STOP_SUCCESSFUL });
  } catch (error) {
    yield put({ type: sagaConstants.LOCATION_WATCH_STOP_FAILED, error: error });
  }
}


// Den Dispatch über den Store weiterzureichen, ist ein Dirty Hack,
// der mir gar nicht gefällt :-(
function* doSubscribeWatch(watch, dispatch) {
  yield watch.subscribe(
    function (geoPosition) { doSubscribeWatchUpdate(geoPosition, dispatch); },
    function (geoError) { doSubscribeWatchError(geoError, dispatch); }
  );
}

function doSubscribeWatchUpdate(geoPosition, dispatch) {
  dispatch({
    type: sagaConstants.LOCATION_WATCH_UPDATE_SUCCESSFUL, payload: {
      position: geoPosition,
      updatedAt: new Date()
    }
  });
}

function doSubscribeWatchError(geoError, dispatch) {
  dispatch({ type: sagaConstants.LOCATION_WATCH_UPDATE_FAILED, error: geoError });
}






export function* locationGetSaga(getState) {
  // Erst starten, wenn Cordova "device ready" meldet
	yield take(sagaConstants.CORDOVA_DEVICE_READY);
  while (true) {
    yield take(sagaConstants.LOCATION_GET_REQUEST);
    // Wir haben eine neue Anfrage
    try {
      const geoPosition = yield call(locationApi.getLocation);
      yield put({
        type: sagaConstants.LOCATION_GET_REQUEST_SUCCESSFUL, payload: {
          position: geoPosition,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      yield put({ type: sagaConstants.LOCATION_GET_REQUEST_FAILED, error: error });
    }
  }
}









export function* locationSubmitSaga(getState) {
  let lastTask;
  while (true) {
    const action = yield take([sagaConstants.LOCATION_GET_REQUEST_SUCCESSFUL,
      sagaConstants.LOCATION_WATCH_UPDATE_SUCCESSFUL]);
    if (lastTask)
      yield cancel(lastTask);
    lastTask = yield fork(locationCheckForSubmitSaga, getState, action);
  }
}

export function* locationSubmitForceSaga(getState) {
  while (true) {
    if (locationApi.isLocationTooOld(getState().location.locationUpdatedAt)) {
      // Okay, wir müssen ein Update an den Server schicken, falls wir eingeloggt sind
      if (getLoggedIn(getState())) {
        yield fork(doSubmitNewLocation, getState().user.token, getState().location.currentLocation);
      }
    }
    // Hier den Timer für erzwungene Updates...
    yield call(delay, locationApi.LOCATION_FRESHNESS_IN_MS);
  }
}


function* locationCheckForSubmitSaga(getState, action) {
  // Nur durchführen, wenn wir eingeloggt sind
  if (getLoggedIn(getState())) {
    try {
      // Die alte Position
      const lastLocation = getState().location.lastLocation;
      // Die neue Position
      // Schon mal Unterscheidung zwischen nativem Geolocation und BGGeolocation
      const newLocation =
        action.payload.position.coords ? action.payload.position.coords : action.payload.position;
      // Haben wir uns bewegt?
      if (locationApi.haveWeMoved(lastLocation, newLocation)) {
        // Ja, wir haben uns weit genug bewegt!
        // Dann müssen wir das dem Server übermitteln
        yield fork(doSubmitNewLocation, getState().user.token, newLocation);
      }
    } catch (error) {
      console.error("locationCheckForSubmitSaga vorzeitig abgebrochen", error);
    }
  }
}


function* doSubmitNewLocation(token, location) {
  try {
    yield put({ type: sagaConstants.LOCATION_UPDATE_SUBMITTING });
    yield call(locationApi.updateLoc, token, location);
    yield put({ type: sagaConstants.LOCATION_UPDATE_SUBMIT_SUCCESSFUL });
  } catch (error) {
    yield put({ type: sagaConstants.LOCATION_UPDATE_SUBMIT_FAILED, error: error });
  }
}







export function* locationNearbySaga(getState) {
  // Erst starten, wenn Cordova "device ready" meldet
	yield take(sagaConstants.CORDOVA_DEVICE_READY);
  // Erst starten, nachdem wir einmal erfolgreich die Position übermitteln konnten
  yield take(sagaConstants.LOCATION_UPDATE_SUBMIT_SUCCESSFUL);
  // Wenn wir eingeloggt und online sind, initial die Nearby-Liste abrufen
  if (getLoggedIn(getState())) {
    yield call(doGetNearbyList, getState().user.token, getState);
  }
  while (true) {
    const {called, timeout, remove} = yield race({
      called: take([sagaConstants.LOCATION_NEARBY_REQUEST, sagaConstants.USER_UPDATE_REQUEST_SUCCESSFUL]),
      timeout: call(delay, locationApi.LOCATION_NEARBY_TIMEOUT_IN_MS),
      remove: take([sagaConstants.USER_UPDATE_REQUEST_FAILED, sagaConstants.USER_LOGOUT_REQUEST_SUCCESSFUL])
    });
    if (remove) {
      // Wir sind nicht (mehr) eingeloggt, Liste leeren
      yield put({ type: sagaConstants.LOCATION_NEARBY_CLEAR, payload: new Date() });
    } else {
      yield call(delay, 1000);
      // Nun die Liste abrufen
      const {token} = getState().user;
      // if (getLoggedIn(getState())) {
        yield fork(doGetNearbyList, token, getState);
      // }
    }
  }
}


function* doGetNearbyList(token, getState) {
  try {
    yield put({ type: sagaConstants.LOCATION_NEARBY_REQUESTING });
    let nearbyList = yield call(locationApi.getNearbyList, token);
    if (nearbyList.length < 1) {
      // Neues Objekt mit den aktuellen User-Daten erzeugen
      if (getState().location.currentLocation && getState().location.currentLocation.latitude) {
        let firstEntry = {
          id: getState().user.userObject.id,
          flag: "",
          location: {
            lat: getState().location.currentLocation.latitude,
            lng: getState().location.currentLocation.longitude
          }
        };
        nearbyList.push(firstEntry);
      }
    } else {
      // Wenn wir im State unseren aktuellen Standort haben, dann diesen verwenden
      if (getState().location.currentLocation && getState().location.currentLocation.latitude) {
        nearbyList[0].location = {
          lat: getState().location.currentLocation.latitude,
          lng: getState().location.currentLocation.longitude
        };
      }
    }
    yield put({
      type: sagaConstants.LOCATION_NEARBY_REQUEST_SUCCESSFUL, payload: {
        nearbyList: nearbyList,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    yield put({ type: sagaConstants.LOCATION_NEARBY_REQUEST_FAILED, error: error });
  }
}
