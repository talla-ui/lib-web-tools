import { Activity, FormContext, ObservedObject, app } from "talla-ui";
import newDialog from "./views/new-dialog";
import { FooItem } from "./FooActivity";

export class NewFooActivity extends Activity {
	showPage = !app.renderer?.viewport.col3;

	item?: FooItem;

	formContext = new FormContext(
		{
			title: { isString: {} },
			quantity: { isNumber: { positive: true, integer: true } },
		},
		{
			quantity: 1,
		},
	);

	protected createView() {
		this.setRenderMode(this.showPage ? "page" : "dialog");
		return newDialog.create();
	}

	onSave() {
		let values = this.formContext.validate();
		if (!values) {
			app.showAlertDialogAsync("Please correct your inputs");
			return;
		}
		let { title, quantity } = values;
		let weight = Math.floor(Math.random() * 100);
		this.item = Object.assign(new ObservedObject(), {
			title,
			quantity,
			weight,
			total: quantity * weight,
		});
		this.unlink();
	}

	onCancel() {
		this.item = undefined;
		this.unlink();
	}
}
