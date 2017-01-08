import {Inject, OpaqueToken} from "angular2/core";
import {Page, NavController} from "ionic-angular";
import {TabsPage} from "../tabs/tabs";
import {SignupPage} from "../signup/signup";

import * as sagaConstants from "../../sagas/sagaConstants";


@Page({
  templateUrl: "build/pages/login/login.html"
})
export class LoginPage {

  static get parameters() {
    return [
      [OpaqueToken("ngRedux")], [NavController]
    ];
  }

  constructor(ngRedux, nav) {
    this.ngRedux = ngRedux;
    this.nav = nav;
    this.unsubscribe = ngRedux.connect(this.mapStateToThis, this.mapDispatchToThis)(this);
    this.login = {};
    this.login.username = "";
    this.login.password = "";
    this.submitted = false;
  }


  onLogin(form) {
    this.submitted = true;
    if (form.valid) {
      let {email, password} = form.value;
      this.dispatch({type: sagaConstants.USER_LOGIN_REQUEST, payload: {
        email: email,
        password: password
      }});
      this.nav.push(TabsPage);
    }
  }


  onSignup() {
    this.nav.push(SignupPage);
  }



  mapStateToThis(state) {
    const {token, userObject} = state.user;
    return {
      token: token,
      userObject: userObject
    };
  }

  mapDispatchToThis(dispatch) {
    return {
      dispatch: dispatch
    };
  }

}
