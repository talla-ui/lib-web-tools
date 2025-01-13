import { $activity, $viewport, ui } from "talla-ui";

const countNumberStyle = ui.style.LABEL.extend({
	tabularNums: true,
	grow: 1,
	bold: true,
	padding: 16,
});
const countButtonStyle = ui.style.BUTTON_PLAIN.extend({
	grow: 1,
	width: 100,
	borderRadius: 0,
});

export default (
	<cell
		layout={{ distribution: "start" }}
		padding={16}
		style={{ width: "100%", maxWidth: 600 }}
		position={{ gravity: "center" }}
	>
		<spacer hidden={$viewport.boolean("col3")} height={40} />

		<row height={48}>
			<label bold fontSize={20}>
				Bar
			</label>
		</row>
		<separator />
		<spacer height={32} />

		<cell
			background={ui.color.BACKGROUND.contrast(-0.1)}
			borderRadius={16}
			style={{ grow: 0 }}
		>
			<cell
				style={{ height: 200 }}
				background={ui.color.BACKGROUND.contrast(-0.05)}
			>
				<image url="https://picsum.photos/800/600" />
			</cell>
			<row spacing={0}>
				<cell>
					<label fontSize={64} style={countNumberStyle}>
						{$activity.bind("count")}
					</label>
				</cell>
				<separator vertical margin={0} />
				<column layout={{ distribution: "fill" }}>
					<button
						icon={ui.icon.CHEVRON_UP}
						style={countButtonStyle}
						onClick="IncrementCount"
					/>
					<button
						icon={ui.icon.CHEVRON_DOWN}
						style={countButtonStyle}
						onClick="DecrementCount"
					/>
				</column>
			</row>
		</cell>
	</cell>
);
