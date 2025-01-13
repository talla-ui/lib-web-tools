import { Activity, app } from "talla-ui";
import screen from "./screen";

export class BarActivity extends Activity {
	title = "Bar";
	navigationPageId = "bar";

	count = 0;

	createView() {
		this.setRenderMode("none");
		return screen.create();
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
