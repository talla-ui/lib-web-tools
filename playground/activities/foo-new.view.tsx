import { $activity, ui } from "talla-ui";

export default (
	<cell
		layout={{ distribution: "start" }}
		position={{ gravity: "center" }}
		style={{ width: 450, maxWidth: "100%" }}
		padding={$activity("showPage").select(
			{ x: 12, top: 48 },
			{ x: 20, top: 8, bottom: 20 },
		)}
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

		<column spacing={4}>
			<label dim onPress="RequestFocusNext">
				Name
			</label>
			<textfield formField="title" requestFocus />
		</column>
		<spacer height={16} />
		<column spacing={4}>
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
		<separator margin={24} hidden={$activity("showPage")} />

		<row align="end" hidden={$activity("showPage")}>
			<button onClick="Save" primary>
				Save
			</button>
			<button onClick="Cancel">Cancel</button>
		</row>

		<column hidden={$activity.not("showPage")} spacing={8}>
			<button onClick="Save" primary>
				Save
			</button>
			<button onClick="Cancel">Cancel</button>
		</column>
	</cell>
);
