import * as sagaConstants from "../sagas/sagaConstants";


const initialState = {
  dispatch: null,
  requestPending: false,
  lastRequestFailed: false,
  socket: null
};


export default (state = initialState, action) => {
  switch (action.type) {
    case sagaConstants.SOCKET_START_REQUEST:
      return Object.assign({}, state, {dispatch: action.payload});
    case sagaConstants.SOCKET_START_REQUESTING:
      return Object.assign({}, state, {requestPending: true, lastRequestFailed: false});
    case sagaConstants.SOCKET_START_REQUEST_SUCCESSFUL:
      return Object.assign({}, state, {lastRequestFailed: false, requestPending: false,
        socket: action.payload});
    case sagaConstants.SOCKET_START_REQUEST_FAILED:
      return Object.assign({}, state, {lastRequestFailed: true, requestPending: false});

    case sagaConstants.SOCKET_STOP_REQUEST:
      // Hier aktuell nichts am State machen
      return state;
    case sagaConstants.SOCKET_STOP_REQUESTING:
      return Object.assign({}, state, {requestPending: true, lastRequestFailed: false});
    case sagaConstants.SOCKET_STOP_REQUEST_SUCCESSFUL:
      return Object.assign({}, state, {lastRequestFailed: false, requestPending: false,
        socket: null});
    case sagaConstants.SOCKET_STOP_REQUEST_FAILED:
      return Object.assign({}, state, {lastRequestFailed: true, requestPending: false});

    case sagaConstants.SOCKET_SUBMIT_USERID:
      // Hier aktuell nichts am State machen
      return state;
    case sagaConstants.SOCKET_SUBMITTING_USERID:
      return Object.assign({}, state, {requestPending: true, lastRequestFailed: false});
    case sagaConstants.SOCKET_SUBMIT_USERID_SUCCESSFUL:
      return Object.assign({}, state, {lastRequestFailed: false, requestPending: false});
    case sagaConstants.SOCKET_SUBMIT_USERID_FAILED:
      return Object.assign({}, state, {lastRequestFailed: true, requestPending: false});


    default:
      return state;
  }
};
