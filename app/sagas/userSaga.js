const {fork, call, take, put} = require("redux-saga/effects");
import * as sagaConstants from "./sagaConstants";
import * as userApi from "../api/userApi";
import {getLoggedIn} from "../selectors/userSelector";
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));



export function* userSessionSaga(getState) {
  // Erst starten, wenn Cordova "device ready" meldet
  yield take(sagaConstants.CORDOVA_DEVICE_READY);
  while (true) {
    // Wir versuchen nun, das User-Objekt zu aktualisieren
    // Das gelingt nur, wenn wir eingeloggt waren oder sind
    yield put({ type: sagaConstants.USER_UPDATE_REQUEST });
    // Nun warten wir auf das Ergebnis
    const updateAction = yield take([sagaConstants.USER_UPDATE_REQUEST_FAILED,
      sagaConstants.USER_UPDATE_REQUEST_SUCCESSFUL]);
    if (updateAction.type === sagaConstants.USER_UPDATE_REQUEST_FAILED) {
      // Wir sind nicht eingeloggt
      // Also warten wir auf die Login-Saga
      const loginAction = yield take(sagaConstants.USER_LOGIN_REQUEST);
      // Yay, wir haben einen Login-Versuch!
      const {email, password} = loginAction.payload;
      const loginSuccessful = yield call(doLogin, email, password);
      // TODO: Vorläufig ignorieren wir noch das Ergebnis des Logins
      if (loginSuccessful) {
        // Erfolgreich eingeloggt
        // Hier nichts weiter machen, die Schleife wird nun erneut durchlaufen
      } else {
        // Login fehlgeschlagen
        // Hier nichts weiter machen, die Schleife wird nun erneut durchlaufen
      }
    } else {
      // Wir sind eingeloggt, das User-Objekt wurde aktualisiert
      // Also warten wir auf die Logout-Saga
      const logoutAction = yield take(sagaConstants.USER_LOGOUT_REQUEST);
      // Och nöö, User will sich ausloggen
      // Aktuelles Token ermitteln
      const {user} = getState();
      const logoutSuccessful = yield call(doLogout, user.token);
      if (logoutSuccessful) {
        // 
      } else {
        //
      }
    }
  }
}


export function* userUpdateSaga(getState) {
  // Erst starten, wenn Cordova "device ready" meldet
  yield take(sagaConstants.CORDOVA_DEVICE_READY);
  while (true) {
    yield take(sagaConstants.USER_UPDATE_REQUEST);
    // Wir haben eine Anfrage bekommen, den User zu aktualisieren
    // Dazu ermitteln wir das Token aus dem State und fragen den Server
    // Zuerst warten wir aber eine halbe Sekunde
    yield call(delay, 500);
    const {user} = getState();
    yield fork(doUpdate, user.token);
  }
}







function* doLogin(email, password) {
  try {
    yield put({ type: sagaConstants.USER_UPDATE_REQUESTING });
    const userPayload = yield call(userApi.login, email, password);
    return yield put({ type: sagaConstants.USER_LOGIN_REQUEST_SUCCESSFUL, payload: userPayload });
  } catch (error) {
    yield put({ type: sagaConstants.USER_LOGIN_REQUEST_FAILED, error: error });
  }
}


function* doLogout(token) {
  try {
    yield put({ type: sagaConstants.USER_LOGOUT_REQUESTING });
    yield call(userApi.logout, token);
    yield put({ type: sagaConstants.USER_LOGOUT_REQUEST_SUCCESSFUL });
  } catch (error) {
    yield put({ type: sagaConstants.USER_LOGOUT_REQUEST_FAILED, error: error });
  }
}


function* doUpdate(token) {
  try {
    yield put({ type: sagaConstants.USER_UPDATE_REQUESTING });
    const updatePayload = yield call(userApi.update, token);
    yield put({ type: sagaConstants.USER_UPDATE_REQUEST_SUCCESSFUL, payload: updatePayload });
  } catch (error) {
    yield put({ type: sagaConstants.USER_UPDATE_REQUEST_FAILED, error: error });
  }
}




export function* userLoadOptionsSaga(getState) {
  // Erst starten, wenn Cordova "device ready" meldet
  yield take(sagaConstants.CORDOVA_DEVICE_READY);

  while (true) {
    const userUpdateAction = yield take([sagaConstants.USER_UPDATE_REQUEST_SUCCESSFUL,
      sagaConstants.USER_UPDATE_REQUEST_FAILED, sagaConstants.USER_OPTIONS_LOAD_REQUEST]);
    if (userUpdateAction.type === sagaConstants.USER_UPDATE_REQUEST_FAILED) {
      // Nicht eingeloggt
      yield put({ type: sagaConstants.USER_OPTIONS_UNLOAD_REQUEST });
    } else {
      // Eingeloggt
      yield fork(doLoadUserOptions, getState().user.token);
    }
  }
}


function* doLoadUserOptions(token) {
  // yield put({ type: sagaConstants.USER_OPTIONS_LOAD_REQUEST });
  try {
    yield put({ type: sagaConstants.USER_OPTIONS_LOAD_REQUESTING });
    const remaining = yield call(userApi.getRemainingTestAlarms, token);
    yield put({
      type: sagaConstants.USER_OPTIONS_LOAD_REQUEST_SUCCESSFUL,
      payload: {
        remainingTestAlarms: remaining
      }
    });
  } catch (error) {
    yield put({ type: sagaConstants.USER_OPTIONS_LOAD_REQUEST_FAILED, error: error });
  }
}




export function* userSaveOptionsSaga(getState) {
  // Erst starten, wenn Cordova "device ready" meldet
  yield take(sagaConstants.CORDOVA_DEVICE_READY);
  while (true) {
    const userUpdateAction = yield take(sagaConstants.USER_OPTIONS_SAVE_REQUEST);
    if (getState().user.token && getState().user.userObject) {
      // Nur, wenn wir eingeloggt sind
      yield fork(doSaveUserOptions, getState().user.token, userUpdateAction.payload);
    }
  }
}


function* doSaveUserOptions(token, options) {
  try {
    yield put({ type: sagaConstants.USER_OPTIONS_SAVE_REQUESTING });
    yield call(userApi.changeReceiveTestAlarms, options.receiveTestAlarms);
    yield put({ type: sagaConstants.USER_OPTIONS_SAVE_REQUEST_SUCCESSFUL, payload: options });
  } catch (error) {
    yield put({ type: sagaConstants.USER_OPTIONS_SAVE_REQUEST_FAILED, error: error });
  }
}
