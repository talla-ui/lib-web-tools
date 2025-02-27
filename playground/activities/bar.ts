import { Activity, app } from "talla-ui";
import barView from "./bar.view";

export class BarActivity extends Activity {
	title = "Bar";
	navigationPageId = "bar";

	count = 0;

	createView() {
		return barView.create();
	}

	onIncrementCount() {
		this.count++;
	}

	onDecrementCount() {
		if (!this.count) {
			app.log.error("Counter cannot be negative");
			return;
		}
		this.count--;
	}
}
