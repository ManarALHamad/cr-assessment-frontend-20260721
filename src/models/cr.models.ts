/** Domain models as seen by the frontend (mirror the API response shapes). */

//the table on the left chane request status
export type CrStatus = 'DRAFT' | 'SUBMITTED' | 'PENDING_APPROVAL' | 'APPROVED' | 'APPLIED' | 'REJECTED' | 'CANCELLED';

//represent the current user (user id) and the organization that the user belongs to.
//cr_r_o can read prganozation CR , cr_a_o can approve prganization CR
export interface ReqUser {
	id: string;
	orgCode: string;
	policies: string[]; // e.g. ['cr_r_o', 'cr_a_o'] — see README for the convention
}

//represent one item inside the purchase agreement 
//the table on the right (there is a bug here)
export interface LineItem {
	sku: string;
	description: string;
	quantity: number;
	unitPrice: number;
}

//the table on the left

export interface CrSummary {
	id: string;  
	title: string;
	status: CrStatus;
	orgCode: string;
	delta: number; //difference in total value
	currency: string;
	updatedAt: string; // ISO
}

//represents one event in CR history (on the right)
export interface TimelineEntry {
	action: string; //send for approval
	byUserId: string;
	at: string; // ISO
	note?: string; //optional
}


//crDetail contains everything in CrSummary plus additional detail

export interface CrDetail extends CrSummary {
	agreementId: string; //purchase agreement
	baselineLineItems: LineItem[]; //agreement b4 the change 
	proposedLineItems: LineItem[]; //agreement after the proposed change
	baselineTotal: number; //total agreement value b4 the change
	newTotal: number; //total after the change
	audit: TimelineEntry[]; //complete history of cr
}
