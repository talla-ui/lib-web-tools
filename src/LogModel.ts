import { app, ManagedList, ManagedObject } from "talla-ui";
import { PropertyInfo } from "./PropertyInfo";

let format = new Intl.DateTimeFormat(undefined, {
	timeStyle: "medium",
	dateStyle: undefined,
});

export type LogMessage = ManagedObject & {
	t: number;
	time: string;
	expr?: string;
	var?: string;
	text: string;
	loc: string;
	level: number;
	isError: boolean;
	data: unknown[];
	dataDisplay?: string;
};

export class LogModel extends ManagedObject {
	constructor() {
		super();
		app.log.addHandler(
			0,
			(m) => {
				let loc = "";
				let s = new Error().stack?.split(/\n/);
				while (s?.length) {
					if (!/LogWriter|talla-ui/.test(s.shift()!)) continue;
					while (/LogWriter|talla-ui/.test(s[0]!)) s.shift();
					loc = (s[0] || "")
						.replace(/^\s*at\s+/, "")
						.replace(/^([^\/]*\/)+/, "")
						.replace(/\?[^:]+/, "")
						.trim();
					break;
				}
				let expr = "";
				let exprVar: string | undefined = undefined;
				let data = m.data;
				let text = m.message;
				if (
					m.data[0] &&
					typeof m.data[0] === "object" &&
					"_eval" in m.data[0]
				) {
					expr = m.data[0]._eval;
					exprVar = m.data[0]._var;
					data = [m.data[0].error || m.data[0].result];
					text = String(m.data[0].error || "");
				}
				let listItem = Object.assign(new ManagedObject(), {
					t: Date.now(),
					time: format.format(new Date()),
					expr,
					var: exprVar,
					text,
					loc: expr ? "" : loc,
					level: m.level,
					isError: m.level >= 4,
					data,
					dataDisplay:
						data.map((d) => PropertyInfo.getDisplayValue(d)).join("\n") ||
						undefined,
				});
				this.numMessages++;
				this.list.add(listItem);
				if (m.level >= 4) {
					this.numErrors++;
					this.errorList.add(listItem);
				}
				if (this.list.count > 999) {
					this.list.remove(this.list.first()!);
				}
				this.emitChange();
			},
			true,
		);
	}

	numMessages = 0;
	list = new ManagedList<LogMessage>();

	numErrors = 0;
	errorList = new ManagedList<LogMessage>();
}
