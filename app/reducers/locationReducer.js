import * as sagaConstants from "../sagas/sagaConstants";


const initialState = {
  currentLocation: {
    latitude: 0.0,
    longitude: 0.0
  },
  lastLocation: {
    latitude: 0.0,
    longitude: 0.0
  },
  locationFailed: false,
  locationUpdatedAt: null,
  watch: null,
  dispatch: null,
  requestPending: false,
  nearbyList: [],
  nearbyListUpdatedAt: null
};


export default (state = initialState, action) => {
  switch (action.type) {

    case sagaConstants.LOCATION_GET_REQUEST:
      // Hier brauchen wir aktuell nichts am State zu machen
      return state;
    case sagaConstants.LOCATION_GET_REQUEST_SUCCESSFUL:
      return Object.assign({}, state, {
        currentLocation: {
          latitude: action.payload.position.coords.latitude,
          longitude: action.payload.position.coords.longitude
        },
        locationUpdatedAt: action.payload.updatedAt,
        locationFailed: false,
        lastLocation: state.currentLocation
      });
    case sagaConstants.LOCATION_GET_REQUEST_FAILED:
      return Object.assign({}, state, {locationFailed: true});

    case sagaConstants.LOCATION_WATCH_START:
      return Object.assign({}, state, {dispatch: action.payload});
    case sagaConstants.LOCATION_WATCH_START_SUCCESSFUL:
      return Object.assign({}, state, {locationFailed: false, watch: action.payload});
    case sagaConstants.LOCATION_WATCH_START_FAILED:
      return Object.assign({}, state, {locationFailed: true});

    case sagaConstants.LOCATION_WATCH_STOP:
      // Hier brauchen wir aktuell nichts am State machen
      return state;
    case sagaConstants.LOCATION_WATCH_STOP_SUCCESSFUL:
      return Object.assign({}, state, {watch: null});
    case sagaConstants.LOCATION_WATCH_STOP_FAILED:
      return Object.assign({}, state, {watch: null, locationFailed: true});

    case sagaConstants.LOCATION_WATCH_UPDATE_SUCCESSFUL: {
      // Schon mal Unterscheidung zwischen nativem Geolocation und BGGeolocation
      const coordinates =
        action.payload.position.coords ? action.payload.position.coords : action.payload.position;
      const {latitude, longitude} = action.payload.position.coords;
      return Object.assign({}, state, {
        currentLocation: {latitude: latitude, longitude: longitude},
        locationUpdatedAt: action.payload.updatedAt,
        locationFailed: false,
        lastLocation: state.currentLocation
      });
    }
    case sagaConstants.LOCATION_WATCH_UPDATE_FAILED:
      return Object.assign({}, state, {locationFailed: true, watch: null});

    case sagaConstants.LOCATION_UPDATE_SUBMIT:
      return Object.assign({}, state, {requestPending: false});
    case sagaConstants.LOCATION_UPDATE_SUBMITTING:
      return Object.assign({}, state, {requestPending: true});
    case sagaConstants.LOCATION_UPDATE_SUBMIT_SUCCESSFUL:
      return Object.assign({}, state, {requestPending: false});
    case sagaConstants.LOCATION_UPDATE_SUBMIT_FAILED:
      return Object.assign({}, state, {requestPending: false});

    case sagaConstants.LOCATION_NEARBY_REQUEST:
      // Hier brauchen wir aktuell nichts am State machen
      return state;
    case sagaConstants.LOCATION_NEARBY_REQUESTING:
      return Object.assign({}, state, {requestPending: true});
    case sagaConstants.LOCATION_NEARBY_REQUEST_SUCCESSFUL:
      return Object.assign({}, state, {
        nearbyList: action.payload.nearbyList,
        nearbyListUpdatedAt: action.payload.updatedAt,
        requestPending: false
      });
    case sagaConstants.LOCATION_NEARBY_REQUEST_FAILED:
      return Object.assign({}, state, {requestPending: false});
    case sagaConstants.LOCATION_NEARBY_CLEAR:
      return Object.assign({}, state, {nearbyList: [], nearbyListUpdatedAt: action.payload});

    default:
      return state;
  }

};
