import {createStore, applyMiddleware, compose} from "redux";

const storage = require("redux-storage");
const createEngine = require("redux-storage-engine-localstorage").default;
const filter = require("redux-storage-decorator-filter").default;
const debounce = require("redux-storage-decorator-debounce").default;

const createSagaMiddleware = require("redux-saga").default;

const createLogger = require("redux-logger");

import {userSessionSaga, userUpdateSaga, userLoadOptionsSaga, userSaveOptionsSaga} from "../sagas/userSaga";
import {locationWatchSaga, locationGetSaga, locationSubmitSaga, locationSubmitForceSaga, locationNearbySaga}
  from "../sagas/locationSaga";
import {socketSaga, socketSubmitSaga} from "../sagas/socketSaga";
import {networkSaga} from "../sagas/networkSaga";
import {alarmInitSaga, alarmPushInitSaga, alarmSocketInitSaga, alarmProcessRawPayloads,
  watchAlarmFiredSaga, watchAlarmStoppedSaga, watchGotAlarm, watchConfirmerAlarmStopped} from "../sagas/alarmSaga";

import combinedReducer from "../reducers/index";
const reducer = storage.reducer(combinedReducer);




let engine = createEngine("aidcallpro");
engine = filter(engine, ["user", "alarm"], ["location", "socket", "network"]);
engine = debounce(engine, 2000);
const storageMiddleware = storage.createMiddleware(engine);

const sagaMiddleWare = createSagaMiddleware(
  networkSaga,
  socketSaga, socketSubmitSaga,
  userSessionSaga, userUpdateSaga, userLoadOptionsSaga, userSaveOptionsSaga,
  locationWatchSaga, locationGetSaga, locationSubmitSaga, locationSubmitForceSaga, locationNearbySaga,
  alarmInitSaga, alarmPushInitSaga, alarmSocketInitSaga, alarmProcessRawPayloads, watchAlarmFiredSaga,
    watchAlarmStoppedSaga, watchGotAlarm, watchConfirmerAlarmStopped
);

const logger = createLogger({duration: true, timestamp: false});

const createStoreWithMiddleware = compose(
  applyMiddleware(sagaMiddleWare),
  applyMiddleware(storageMiddleware),
  applyMiddleware(logger)
)(createStore);

const store = createStoreWithMiddleware(reducer);

const load = storage.createLoader(engine);
load(store)
    .then((newState) => console.log("State geladen:", newState))
    .catch(() => console.log("Konnte den vorherigen State nicht laden"));



export default () => {
  return store;
};
