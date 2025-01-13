import { Activity, app, bind, UIScrollContainer } from "talla-ui";
import screen from "./screen";

export class MainActivity extends Activity {
	page?: Activity;

	createView() {
		return screen.create();
	}

	protected async afterActiveAsync() {
		bind("activities.activated").bindTo(this, (page) => {
			app.log.debug("Page activated", page?.title);
			if (page !== this) this.page = page;
			this.title = String(this.page?.title || "Web tools playground");

			// reset scroll position (a bit hacky but this works)
			this.findViewContent(UIScrollContainer)[0]?.scrollToTop();

			// use foo as default page
			setTimeout(() => {
				if (!this.page) {
					app.log.debug("Navigating to foo");
					app.navigate("foo");
				}
			});
		});
	}
}
