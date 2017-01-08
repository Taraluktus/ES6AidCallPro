import {createSelector} from "reselect";

const getUserToken = (state) => state.user.token;
const getUserObject = (state) => state.user.userObject;
const getOnline = (state) => state.network.connected;

export const getLoggedIn = createSelector(
	getUserToken, getUserObject, getOnline,
	(token, userObject, connected) => {
		if (token && userObject && connected) {
			return true;
		}
		return false;
	});
