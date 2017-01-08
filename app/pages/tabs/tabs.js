import {Inject, OpaqueToken} from "angular2/core";
import {Page, NavParams} from "ionic-angular";
import {MapPage} from "../map/map";
import {OptionsPage} from "../options/options";
import {AboutPage} from "../about/about";
import {getLoggedIn} from "../../selectors/userSelector";


@Page({
  templateUrl: "build/pages/tabs/tabs.html"
})
export class TabsPage {

  static get parameters() {
    return [
      [OpaqueToken("ngRedux")], [NavParams]
    ];
  }

  constructor(ngRedux, navParams) {
    // set the root pages for each tab
    this.tab1Root = MapPage;
    this.tab2Root = AboutPage;
    this.loggedIn = false;
    this.unsubscribe = ngRedux.connect(this.mapStateToThis)(this);
    this.mySelectedIndex = navParams.data.tabIndex || 0;
  }

  mapStateToThis(state) {
    return {
      loggedIn: getLoggedIn(state)
    };
  }

  onPageWillUnload() {
    if (this.unsubscribe)
      this.unsubscribe();
  }

}
