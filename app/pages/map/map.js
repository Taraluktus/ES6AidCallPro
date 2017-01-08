import {Inject, OpaqueToken} from "angular2/core";
import {Page, Platform, NavController, ActionSheet} from "ionic-angular";
import {Radar} from "../../components/radar/radar";
import * as sagaConstants from "../../sagas/sagaConstants";
import * as alarmSelector from "../../selectors/alarmSelector";
import * as userSelector from "../../selectors/userSelector";


@Page({
  templateUrl: "build/pages/map/map.html",
  directives: [Radar]
})
export class MapPage {

  static get parameters() {
    return [
      [OpaqueToken("ngRedux")], [Platform], [NavController]
    ];
  }


  constructor(ngRedux, platform, nav) {
    this.ngRedux = ngRedux;
    this.platform = platform;
    this.nav = nav;
    this.nearbyList = [];
    this.initNearbyList = [];
    this.initialNearbyList = [];
    this.isAlarmRunning = false;
    this.personsInAlarmRange = "";
    this.personsConfirmed = "";
    this.distanceToLastConfirmer = "";
    this.isConfirmActive = false;
    this.distanceToAlarmer = "";
    this.addressOfAlarmer = "";
    this.remainingTestAlarms = 0;
    this.initialLocation = this.initLoc;
    this.initialNearbyList = this.initNearbyList;
    this.unsubscribe = ngRedux.connect(this.mapStateToThis, this.mapDispatchToThis)(this);
  }

  mapStateToThis(state) {
    const {currentLocation, nearbyList} = state.location;
    if (userSelector.getLoggedIn(state)) {
      return {
        // Radar
        currentLocation: currentLocation,
        nearbyList: nearbyList,
        initLoc: currentLocation,
        initNearbyList: nearbyList,
        // Info-Card Alarmer
        isAlarmRunning: alarmSelector.isAlarmRunning(state),
        personsInAlarmRange: alarmSelector.getPersonsAlarmRange(state),
        personsConfirmed: alarmSelector.getNumberOfConfirmed(state),
        distanceToLastConfirmer: alarmSelector.getDistanceOfLastConfirmer(state),
        remainingTestAlarms: state.user.options.remainingTestAlarms,
        // Info-Card Confirmer
        isConfirmActive: alarmSelector.isConfirmActive(state),
        distanceToAlarmer: alarmSelector.getDistance(state),
        addressOfAlarmer: alarmSelector.getAddress(state)
      };
    } else {
      return {
        currentLocation: currentLocation,
        nearbyList: nearbyList,
        initNearbyList: nearbyList,
        isAlarmRunning: false,
        isConfirmActive: false
      };
    }
  }

  mapDispatchToThis(dispatch) {
    return {
      dispatch: dispatch
    };
  }

  onPageWillLeave() {
  }

  onPageWillUnload() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  onPageLoaded() {
  }

  onPageWillEnter() {
  }

  doAlarm() {
    this.dispatch({ type: sagaConstants.ALARM_ALARM_FIRE });
  }

  doTestAlarm() {
    this.dispatch({ type: sagaConstants.ALARM_TESTALARM_FIRE });
  }

  stopAlarm() {
    this.dispatch({ type: sagaConstants.ALARM_ALARM_STOP });
  }



  presentAlarmActionSheet() {
    let actionSheet;
    if (this.remainingTestAlarms >= 1) {
      actionSheet = ActionSheet.create({
        title: "Wähle deine Alarmierung",
        buttons: [
          {
            text: "ALARM",
            role: "destructive",
            handler: () => {
              this.doAlarm();
            }
          }, {
            text: `Test-Alarm (noch ${this.remainingTestAlarms} übrig)`,
            handler: () => {
              this.doTestAlarm();
            }
          }, {
            text: "Abbrechen",
            role: "cancel",
            handler: () => {
              // console.log("Cancel clicked");
            }
          }
        ]
      });
    } else {
      actionSheet = ActionSheet.create({
        title: "Wähle deine Alarmierung",
        buttons: [
          {
            text: "ALARM",
            role: "destructive",
            handler: () => {
              this.doAlarm();
            }
          }, {
            text: "Abbrechen",
            role: "cancel",
            handler: () => {
              // console.log("Cancel clicked");
            }
          }
        ]
      });
    }
    this.nav.present(actionSheet);
  }
}
