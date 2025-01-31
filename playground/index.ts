import { setWebToolsToggleKey, showWebTools } from "@talla-ui/lib-web-tools";
import { useWebContext } from "@talla-ui/web-handler";
import { ui } from "talla-ui";
import { BarActivity } from "./activities/bar/BarActivity";
import { FooActivity } from "./activities/foo/FooActivity";
import { MainActivity } from "./activities/main/MainActivity";

const app = useWebContext((options) => {
	options.darkTheme = options.theme.clone();
	options.darkTheme.colors.set("Background", ui.color("#111"));
});

setWebToolsToggleKey("I", { ctrl: true });
showWebTools(undefined, true);

app.log.debug("App started", app.navigation.pageId);
if (app.navigation.pageId === "") {
	app.log.debug("Navigating from / to foo");
	setTimeout(() => app.navigate("foo"));
}
app.navigation.listen((e) => {
	if (e.name === "PageNotFound") {
		app.log.error("Page not found", app.navigation.pageId);
		app.navigate("foo", { replace: true });
	}
});

app.addActivity(new MainActivity(), true);
app.addActivity(new FooActivity());
app.addActivity(new BarActivity());
