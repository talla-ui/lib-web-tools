import { $activity, ui } from "talla-ui";

export default (
	<cell
		layout={{ distribution: "start" }}
		style={{ width: 450, maxWidth: "100%" }}
		padding={$activity
			.boolean("showPage")
			.select({ x: 12, top: 48 }, { x: 20, top: 8, bottom: 20 })}
		onEnterKeyPress="Save"
	>
		<row height={48}>
			<label bold fontSize={16}>
				New item
			</label>
			<spacer />
			<button
				onClick="Cancel"
				icon={ui.icon.CLOSE}
				style={ui.style.BUTTON_ICON}
			/>
		</row>
		<spacer height={16} />

		<column align="start" spacing={4}>
			<label dim onPress="RequestFocusNext">
				Name
			</label>
			<textfield formField="title" width="100%" requestFocus />
		</column>
		<spacer height={16} />
		<column align="start" spacing={4}>
			<label dim onPress="RequestFocusNext">
				Quantity
			</label>
			<textfield
				formField="quantity"
				width={120}
				type="numeric"
				style={{ textAlign: "end" }}
			/>
		</column>

		<spacer height={32} hidden={$activity.not("showPage")} />
		<separator margin={24} hidden={$activity.boolean("showPage")} />

		<row align="end" hidden={$activity.boolean("showPage")}>
			<button onClick="Save" primary>
				Save
			</button>
			<button onClick="Cancel">Cancel</button>
		</row>

		<column hidden={$activity.not("showPage")} spacing={8}>
			<button onClick="Save" width="100%" primary>
				Save
			</button>
			<button onClick="Cancel" width="100%">
				Cancel
			</button>
		</column>
	</cell>
);
