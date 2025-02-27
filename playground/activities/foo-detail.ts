import { Activity } from "talla-ui";
import { FooItem } from "./foo";
import fooDetailView from "./foo-detail.view";

export class FooDetailActivity extends Activity {
	constructor(public item: FooItem) {
		super();
		this.title = item.title;
	}

	createView() {
		return fooDetailView.create();
	}
}
