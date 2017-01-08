import {Page, NavController, OpaqueToken} from "ionic-angular";
import {TabsPage} from "../tabs/tabs";


@Page({
  templateUrl: "build/pages/signup/signup.html"
})
export class SignupPage {

  static get parameters() {
    return [
      [OpaqueToken("ngRedux")], [NavController]
    ];
  }

  constructor(ngRedux, nav) {
    this.ngRedux = ngRedux;
    this.nav = nav;
    this.submitted = false;
    this.signup = {};
    this.signup.email = "";
    this.signup.password = "";
  }

  onSignup(form) {
    this.submitted = true;
    if (form.valid) {
      this.nav.push(TabsPage);
    }
  }
}
