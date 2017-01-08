import * as sagaConstants from "../sagas/sagaConstants";


const initialState = {
  token: null,
  userObject: null,
  lastRequestFailed: false,
  requestPending: false,
  options: null
};

const initialOptionsState = {
  receiveTestAlarms: false,
  remainingTestAlarms: 0,
  centerMapOnMovement: true,
  getLocationInBackground: true,
  keepSceenAlwaysOn: true
};


export default (state = initialState, action) => {
  switch (action.type) {
    case sagaConstants.USER_LOGIN_REQUEST:
      if (action.payload) {
        return Object.assign({}, state, {lastRequestFailed: false, requestPending: false});
      }
      return state;
    case sagaConstants.USER_LOGIN_REQUESTING:
      // Hier gibts keinen Payload etc.
      return Object.assign({}, state, {requestPending: true});
    case sagaConstants.USER_LOGIN_REQUEST_SUCCESSFUL: {
      // Nur das Token in den State übernehmen
      const {id} = action.payload;
      if (id) {
        return Object.assign({}, state, {token: id, lastRequestFailed: false, requestPending: false});
      }
      return Object.assign({}, state, {requestPending: false});
    }
    case sagaConstants.USER_LOGIN_REQUEST_FAILED:
      return Object.assign({}, state, {lastRequestFailed: true, requestPending: false});

    case sagaConstants.USER_LOGOUT_REQUEST:
      return Object.assign({}, state, {lastRequestFailed: false, requestPending: false});
    case sagaConstants.USER_LOGOUT_REQUESTING:
      return Object.assign({}, state, {requestPending: true});
    case sagaConstants.USER_LOGOUT_REQUEST_SUCCESSFUL:
      // User-State komplett leeren
      return initialState;
    case sagaConstants.USER_LOGOUT_REQUEST_FAILED:
      return Object.assign({}, state, {requestPending: false, lastRequestFailed: true});

    case sagaConstants.USER_UPDATE_REQUEST:
      return Object.assign({}, state, {lastRequestFailed: false, requestPending: false});
    case sagaConstants.USER_UPDATE_REQUESTING:
      return Object.assign({}, state, {requestPending: true});
    case sagaConstants.USER_UPDATE_REQUEST_SUCCESSFUL:
      if (action.payload) {
        return Object.assign({}, state, {userObject: action.payload, lastRequestFailed: false,
          requestPending: false});
      }
      return initialState;
    case sagaConstants.USER_UPDATE_REQUEST_FAILED:
      return Object.assign({}, state, { userObject: null, lastRequestFailed: true, requestPending: false });

    case sagaConstants.USER_OPTIONS_LOAD_REQUEST:
      // Aktuell nichts am State machen
      return Object.assign({}, state, { lastRequestFailed: false, requestPending: false });
    case sagaConstants.USER_OPTIONS_LOAD_REQUESTING:
      return Object.assign({}, state, { requestPending: true });
    case sagaConstants.USER_OPTIONS_LOAD_REQUEST_SUCCESSFUL:
      return Object.assign({}, state, {
        requestPending: false,
        options: Object.assign({}, state.options, {remainingTestAlarms: action.payload.remainingTestAlarms})
      });
    case sagaConstants.USER_OPTIONS_LOAD_REQUEST_FAILED:
      return Object.assign({}, state, { requestPending: false, options: initialOptionsState });
    case sagaConstants.USER_OPTIONS_UNLOAD_REQUEST:
      return Object.assign({}, state, { options: null });

    case sagaConstants.USER_OPTIONS_SAVE_REQUEST:
      // Aktuell nichts am State machen
      return Object.assign({}, state, {
        lastRequestFailed: false, requestPending: false
      });
    case sagaConstants.USER_OPTIONS_SAVE_REQUESTING:
      return Object.assign({}, state, {
        requestPending: true
      });
    case sagaConstants.USER_OPTIONS_SAVE_REQUEST_SUCCESSFUL:
      return Object.assign({}, state, {
        requestPending: false,
        options: action.payload
      });
    case sagaConstants.USER_OPTIONS_SAVE_REQUEST_FAILED:
      return Object.assign({}, state, { requestPending: false });

    default:
      return state;
  }
};
