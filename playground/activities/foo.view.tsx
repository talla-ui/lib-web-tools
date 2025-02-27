import { $activity, $list, $viewport, ui } from "talla-ui";
import { LayoutComponent } from "./layout";

export default (
	<LayoutComponent>
		<cell
			layout={{ distribution: "start" }}
			padding={16}
			style={{ width: "100%", maxWidth: 600 }}
			position={{ gravity: "center" }}
		>
			<spacer hidden={$viewport.boolean("col3")} height={40} />

			<row height={48}>
				<label bold fontSize={20}>
					Foo
				</label>
				<spacer />
				<button
					icon={ui.icon.PLUS}
					iconSize={20}
					onClick="NewItem"
					style={ui.style.BUTTON_ICON}
				/>
			</row>
			<separator />
			<spacer height={8} />

			<row height={48}>
				<label bold>All items</label>
			</row>
			<cell
				background={ui.color.BACKGROUND.contrast(-0.1)}
				borderRadius={8}
				grow={false}
			>
				<list items={$activity.list("items")}>
					<cell style={{ css: { cursor: "pointer" } }} onClick="GoToItem">
						<row height={40} padding={{ start: 12, end: 8 }}>
							<label text={$list.string("item.title")} grow />
							<label icon={ui.icon.CHEVRON_NEXT} iconSize={20} />
						</row>
					</cell>
					<column
						layout={{
							separator: { lineThickness: 1, lineColor: ui.color.BACKGROUND },
						}}
					/>
				</list>
			</cell>

			<spacer hidden={$viewport.boolean("col3")} height={64} />
		</cell>
	</LayoutComponent>
);
