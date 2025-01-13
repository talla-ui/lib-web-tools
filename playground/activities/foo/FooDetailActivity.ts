import { Activity } from "talla-ui";
import detail from "./views/detail";
import { FooItem } from "./FooActivity";

export class FooDetailActivity extends Activity {
	constructor(public item: FooItem) {
		super();
		this.title = item.title;
	}

	createView() {
		this.setRenderMode("none");
		return detail.create();
	}
}
