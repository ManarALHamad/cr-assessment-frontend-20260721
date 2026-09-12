import { LineItem } from '../models/cr.models';

//diff four states
export type DiffKind = 'added' | 'removed' | 'changed' | 'unchanged';

export interface DiffRow {
	sku: string; //stoke keeping unit
	kind: DiffKind;
	baseline?: LineItem;
	proposed?: LineItem;
}

/**
 * Compute the line-item diff shown in the preview panel: which SKUs were added, removed, changed,
 * or left unchanged between the baseline and the proposed line items.
 *
 * Heads-up: the change-detection here is not quite right — a line that changed is sometimes reported
 * as unchanged. `diff.spec.ts` surfaces the defect; the root cause lives in this file.
 */
export function computeDiff(baseline: LineItem[], proposed: LineItem[]): DiffRow[] {
	const rows: DiffRow[] = []; //gives the difference between the two arrays
	const proposedBySku = new Map(proposed.map((p) => [p.sku, p])); //a map of the proposed list
	const baselineBySku = new Map(baseline.map((b) => [b.sku, b])); //a map of the baseline items
//loop to go through each item in the array
	for (const b of baseline) {
		const p = proposedBySku.get(b.sku); //find matching item
		if (!p) { //check if the item is removed
			rows.push({ sku: b.sku, kind: 'removed', baseline: b });
			continue; //stop and move to the next loop
		}
		//this asks if unit price has changed or not (but actually the quantity has changed and the code says unchange)
		//there is a failure in here cause it should check unit price, quantity and description
		//failure is detected and solved i SKU-A changed
		const changed = 
		b.unitPrice !== p.unitPrice ||
		b.description !== p.description ||
		b.quantity !== p.quantity;

		rows.push({ sku: b.sku, kind: changed ? 'changed' : 'unchanged', baseline: b, proposed: p });
	}

	//does the baseline map contain the SKU 
	for (const p of proposed) {
		if (!baselineBySku.has(p.sku)) {
			rows.push({ sku: p.sku, kind: 'added', proposed: p });
		}
	}
	return rows; //return the final result
}

//this diff answers 4 questions
// Was this SKU removed?
//Was this SKU changed?
//Was this SKU unchanged?
//Was this SKU newly added?