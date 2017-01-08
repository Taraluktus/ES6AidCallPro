const {fork, call, apply, take, put} = require("redux-saga/effects");
import * as sagaConstants from "./sagaConstants";
import * as socketApi from "../api/socketApi";


export function* socketSaga(getState) {
  // Erst starten, wenn Cordova "device ready" meldet
  yield take(sagaConstants.CORDOVA_DEVICE_READY);
  while (true) {
    // Auf Starten oder Stoppen warten
    // const socketStartStopAction = yield take([sagaConstants.SOCKET_START_REQUEST,
    // sagaConstants.SOCKET_STOP_REQUEST]);
    // Achtung: Wir warten nun nicht mehr auf das eigenmächtige Starten, sondern starten 
    // automatisch, wenn User erfolgreich eingeloggt
    const socketStartStopAction =
      yield take([sagaConstants.USER_UPDATE_REQUEST_SUCCESSFUL, sagaConstants.USER_UPDATE_REQUEST_FAILED]);
    if (socketStartStopAction.type === sagaConstants.USER_UPDATE_REQUEST_SUCCESSFUL) {
      // Socket einrichten
      yield fork(doSocketSetup);
      // Auf erfolgreiches Einrichten warten
      const socketSetupAction = yield take([sagaConstants.SOCKET_START_REQUEST_SUCCESSFUL,
        sagaConstants.SOCKET_START_REQUEST_FAILED]);
      if (socketSetupAction.type === sagaConstants.SOCKET_START_REQUEST_SUCCESSFUL) {
        // Socket erfolgreich verbunden, nun Listener einrichten
        const socket = socketSetupAction.payload;
        const dispatch = getState().socket.dispatch;
        yield call(doSocketListeners, socket, dispatch);
      } else {
        //
      }
    } else {
      // Socket stoppen, falls wir einen haben
      if (getState().socket.socket) {
        const socketToStop = getState().socket.socket;
        yield fork(doSocketDisconnect, socketToStop);
      }
    }
  }
}

function* doSocketSetup(dispatch) {
  try {
    yield put({ type: sagaConstants.SOCKET_START_REQUESTING });
    let socket = socketApi.createSocket();
    yield put({ type: sagaConstants.SOCKET_START_REQUEST_SUCCESSFUL, payload: socket });
  } catch (error) {
    yield put({ type: sagaConstants.SOCKET_START_REQUEST_FAILED });
  }
}

function* doSocketListeners(socket, dispatch) {
  yield socketApi.onSocket(socket,
    () => { dispatch({ type: sagaConstants.LOCATION_NEARBY_REQUEST }); },
    () => { dispatch({ type: sagaConstants.SOCKET_SUBMIT_USERID }); },
    () => { dispatch({ type: sagaConstants.SOCKET_STOP_REQUEST }); }
  );
}

function* doSocketDisconnect(socket) {
  try {
    yield put({ type: sagaConstants.SOCKET_STOP_REQUESTING });
    socketApi.disconnect(socket);
    yield put({ type: sagaConstants.SOCKET_STOP_REQUEST_SUCCESSFUL });
  } catch (error) {
    yield put({ type: sagaConstants.SOCKET_STOP_REQUEST_FAILED, error: error });
  }
}







export function* socketSubmitSaga(getState) {
  while (true) {
    // Nur, wenn wir eingeloggt sind!
    yield take(sagaConstants.USER_UPDATE_REQUEST_SUCCESSFUL);
    yield take(sagaConstants.SOCKET_SUBMIT_USERID);
    // ID des Users ermitteln
    const {id} = getState().user.userObject;
    const socket = getState().socket.socket;
    yield fork(doSocketSubmit, socket, id);
  }
}

function* doSocketSubmit(socket, id) {
  try {
    yield call(socketApi.submitUserId, socket, id);
    yield put({ type: sagaConstants.SOCKET_SUBMIT_USERID_SUCCESSFUL });
  } catch (error) {
    yield put({ type: sagaConstants.SOCKET_SUBMIT_USERID_FAILED, error: error });
  }
}
