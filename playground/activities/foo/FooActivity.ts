import {
	Activity,
	app,
	ObservedList,
	ObservedObject,
	UIListView,
	UIListViewEvent,
	ViewEvent,
} from "talla-ui";
import { FooDetailActivity } from "./FooDetailActivity";
import { NewFooActivity } from "./NewFooActivity";
import screen from "./views/screen";

export type FooItem = ObservedObject & {
	title: string;
	quantity: number;
	weight: number;
	total: number;
};

const sampleTitles =
	`Bear Bee Bird Cat Dog Dolphin Duck Elephant Fox Frog Giraffe Goat
	Gorilla Horse Lion Monkey Moose Mouse Owl Panda Parrot Penguin Pig
	Rabbit Rat Shark Sheep Skunk Sloth Snake Spider Tiger Turtle Wolf
	Zebra`.split(/\s+/);

export class FooActivity extends Activity {
	constructor() {
		super();
		for (let title of sampleTitles) {
			let quantity = Math.floor(Math.random() * 10);
			let weight = Math.floor(Math.random() * 100);
			let total = quantity * weight;
			this.items.add(
				Object.assign(new ObservedObject(), {
					title,
					quantity,
					weight,
					total,
				}),
			);
		}
	}

	title = "Foo";
	navigationPageId = "foo";

	items = new ObservedList<FooItem>();
	detail?: FooDetailActivity;

	createView() {
		this.setRenderMode("none");
		return screen.create();
	}

	onGoToItem(e: UIListViewEvent<FooItem>) {
		let item = e.data.listViewItem;
		app.log.debug("Navigating to item", item.title);
		app.navigate({ pageId: "foo", detail: item.title });
	}

	async onNewItem() {
		app.log.debug("Creating new item");
		let dialog = this.attach(new NewFooActivity());
		await dialog.activateAsync();
		for await (let _ of dialog.listen(true));
		if (dialog.item) this.items.insert(dialog.item, this.items.first());
	}

	async handleNavigationDetailAsync(detail: string) {
		this.detail?.unlink();
		this.detail = undefined;
		if (!detail) return;
		let item = this.items.find((i) => i.title === detail);
		if (!item) return;
		this.detail = new FooDetailActivity(item);
		app.addActivity(this.detail, true);
		this.deactivateAsync();
	}
}
