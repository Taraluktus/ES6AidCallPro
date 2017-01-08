import * as sagaConstants from "../sagas/sagaConstants";


const initialState = {
  connected: true,
	updatedAt: null
};


export default (state = initialState, action) => {
  switch (action.type) {
		case sagaConstants.NETWORK_GOES_ONLINE:
			return Object.assign({}, state, { connected: true, updatedAt: action.payload });
		case sagaConstants.NETWORK_GOES_OFFLINE:
			return Object.assign({}, state, { connected: false, updatedAt: action.payload });
		default:
			return state;
	}
};
