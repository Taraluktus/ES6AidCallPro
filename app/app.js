// Babel-Polyfill für Regenerator (yield / *)
import "babel-polyfill";
import "es6-shim";

import {Inject, OpaqueToken} from "angular2/core";
import {App, IonicApp, Platform, NavController, Alert} from "ionic-angular";
import {Device, StatusBar, Toast} from "ionic-native";

import * as sagaConstants from "./sagas/sagaConstants";
import configureStore from "./store/configureStore";
const provider = require("ng2-redux").provider;
const store = configureStore();

import {TabsPage} from "./pages/tabs/tabs";
import {LoginPage} from "./pages/login/login";
import {SignupPage} from "./pages/signup/signup";
import {OptionsPage} from "./pages/options/options";




@App({
  templateUrl: "build/app.html",
  providers: [provider(store)],
  config: {
    backButtonText: "Zurück",
    platforms: {
      android: {
        tabbarLayout: "icon-hide"
      }
    }
  }
})
class AidCallProApp {

  static get parameters() {
    return [
      [OpaqueToken("ngRedux")], [IonicApp], [Platform]
    ];
  }

  constructor(ngRedux, app, platform) {
    this.ngRedux = ngRedux;
    this.app = app;
    this.platform = platform;
    this.unsubscribe = ngRedux.connect(this.mapStateToThis, this.mapDispatchToThis)(this);
    this.platform.ready().then(() => {
      let pf = Device.device.platform;
      if (pf && ((pf === "Android") || (pf === "iOS") || (pf.startsWith("windows")))) {
        // Hier Dinge ausführen, die NICHT im Browser möglich sind
        StatusBar.styleDefault();
        StatusBar.show();
        this.runsNatively = true;
      } else {
        // Hier Dinge ausführen, die NUR im Browser möglich sind
        this.runsNatively = false;
      }
      this.dispatch({ type: sagaConstants.CORDOVA_DEVICE_READY });
      // Socket starten
      this.dispatch({ type: sagaConstants.SOCKET_START_REQUEST, payload: this.dispatch });
      // Alarm-System starten
      this.dispatch({ type: sagaConstants.ALARM_SYSTEM_START, payload: this.dispatch });
      // Geolocation im Hintergrund starten
      this.dispatch({ type: sagaConstants.LOCATION_WATCH_START, payload: this.dispatch });
    });
    ngRedux.subscribe(() => this.notificationHandler(ngRedux.getState()));
  }


  openPage(page) {
    // find the nav component and set what the root page should be
    // reset the nav to remove previous pages and only have this page
    // we wouldn"t want the back button to show in this scenario
    let nav = this.app.getComponent("nav");

    if (page.index) {
      nav.setRoot(page.component, { tabIndex: page.index });
    } else {
      nav.setRoot(page.component);
    }

    if (page.title === "Logout") {
      // Give the menu time to close before changing to logged out
      setTimeout(() => {
        this.dispatch({ type: sagaConstants.USER_LOGOUT_REQUEST });
      }, 1000);
    }
  }

  mapDispatchToThis(dispatch) {
    return {
      dispatch: dispatch
    };
  }

  mapStateToThis(state) {
    const {token} = state.user;
    let lI;
    if (token) {
      lI = true;
    } else {
      lI = false;
    }
    return {
      loggedIn: lI
    };
  }





  notificationHandler(state) {
    if (!state)
      return;

    if (!this.alarmActive && state.alarm.alarmActive) {
      if (this.runsNatively) {
        Toast.show("Alarm erfolgreich ausgelöst", "2000", "center").subscribe(toast => console.log(toast));
      } else {
        new Android_Toast({ content: "Alarm erfolgreich ausgelöst", duration: 2000, position: "center" });
      }
    }

    if (this.alarmActive && !state.alarm.alarmActive) {
      if (this.runsNatively) {
        Toast.show("Alarm erfolgreich beendet", "2000", "center").subscribe(toast => console.log(toast));
      } else {
        new Android_Toast({ content: "Alarm erfolgreich beendet", duration: 2000, position: "center" });
      }
    }

    if (!this.testAlarmActive && state.alarm.testAlarmActive) {
      if (this.runsNatively) {
        Toast.show("Test-Alarm erfolgreich ausgelöst", "2000", "center").subscribe(toast => console.log(toast));
      } else {
        new Android_Toast({ content: "Test-Alarm erfolgreich ausgelöst", duration: 2000, position: "center" });
      }
    }

    if (this.testAlarmActive && !state.alarm.testAlarmActive) {
      if (this.runsNatively) {
        Toast.show("Alarm erfolgreich beendet", "2000", "center").subscribe(toast => console.log(toast));
      } else {
        new Android_Toast({ content: "Alarm erfolgreich beendet", duration: 2000, position: "center" });
      }
    }

    if (this.personsConfirmed !== state.alarm.personsConfirmed) {
      if (state.alarm.personsConfirmed >= 1) {
        if (this.runsNatively) {
          Toast.showLongCenter("Ein Helfer hat reagiert!\nEntfernung: " +
            state.alarm.distanceToLastConfirmer + "m")
            .subscribe(toast => console.log(toast));
        } else {
          new Android_Toast({
            content: "Ein Helfer hat reagiert!\nEntfernung: " + state.alarm.distanceToLastConfirmer + "m",
            duration: 3000, position: "center"
          });
        }
      }
    }

    if (!this.receivedConfirmRequest && state.alarm.receivedConfirmRequest) {
      let confirmAlarmAlert = Alert.create({
        title: "Hilferuf erhalten",
        message: "Jemand in " + state.alarm.distanceToAlarmer + "m Entfernung benötigt Hilfe!",
        buttons: [
          {
            text: "Ablehnen",
            handler: () => {
              this.dispatch({ type: sagaConstants.ALARM_CONFIRM_DENY_OR_STALE });
            }
          },
          {
            text: "Annehmen",
            handler: () => {
              this.dispatch({ type: sagaConstants.ALARM_CONFIRM });
            }
          }
        ]
      });
      let nav = this.app.getComponent("nav");
      nav.present(confirmAlarmAlert);
    }

    if (!this.receivedTestConfirmRequest && state.alarm.receivedTestConfirmRequest) {
      let confirmTestAlarmAlert = Alert.create({
        title: "Test-Hilferuf erhalten",
        message: "Jemand in " + state.alarm.distanceToAlarmer + "m Entfernung benötigt Hilfe!\n" +
        "Es handelt sich dabei nur um einen TEST!",
        buttons: [
          {
            text: "Ablehnen",
            handler: () => {
              this.dispatch({ type: sagaConstants.ALARM_CONFIRM_DENY_OR_STALE });
            }
          },
          {
            text: "Annehmen",
            handler: () => {
              this.dispatch({ type: sagaConstants.ALARM_TESTCONFIRM });
            }
          }
        ]
      });
      let nav = this.app.getComponent("nav");
      nav.present(confirmTestAlarmAlert);
    }

    this.alarmActive = state.alarm.alarmActive;
    this.testAlarmActive = state.alarm.testAlarmActive;
    this.personsConfirmed = state.alarm.personsConfirmed;
    this.distanceToLastConfirmer = state.alarm.distanceToLastConfirmer;
    this.receivedConfirmRequest = state.alarm.receivedConfirmRequest;
    this.receivedTestConfirmRequest = state.alarm.receivedTestConfirmRequest;
    this.distanceToAlarmer = state.alarm.distanceToAlarmer;
    this.addressOfAlarmer = state.alarm.addressOfAlarmer;
  }




}
