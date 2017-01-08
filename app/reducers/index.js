import { combineReducers } from "redux";
import location from "./locationReducer";
import user from "./userReducer";
import socket from "./socketReducer";
import network from "./networkReducer";
import alarm from "./alarmReducer";


const rootReducer = combineReducers({
  alarm,
  location,
  user,
  socket,
  network
});

export default rootReducer;
