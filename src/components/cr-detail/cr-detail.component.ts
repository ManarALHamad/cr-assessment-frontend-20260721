import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms'; //reject user input we import this 
import { CrApiService } from '../../api/cr-api.service';
import { SessionService } from '../../session/session.service'; //gives the component the current user
import { CrDetail, TimelineEntry } from '../../models/cr.models';
import { idle, loading, ViewState } from '../../common/view-state';
import { computeDiff, DiffRow } from '../diff.util';
import { formatMoney } from '../../common/money.util'; //compares the number to user-friendly currency representing
import { canApprovePolicy } from '../../common/permissions';
/**
 * Change Request DETAIL page: loads a CR and renders the diff/preview, the approval timeline, and
 * permission-aware Approve/Reject actions. `load`, the diff binding, and the template skeleton are
 * provided; the timeline ordering, permission gating, actions, and reject validation are yours.
 */

@Component({
	selector: 'app-cr-detail', //another template can use this component
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './cr-detail.component.html', //what users see
})
export class CrDetailComponent implements OnInit {
	@Input() id!: string; //the details component needs to know which change request should I display

	state: ViewState<CrDetail> = idle();
	submitting = false;
	actionError?: string; //stores error from an action
	// TODO: add validation so the form is invalid until a reason is entered.


	rejectControl = new FormControl('', { nonNullable: true });

	//private means only class uses them
	constructor(private readonly api: CrApiService, private readonly session: SessionService) {}

	ngOnInit(): void {
		void this.load();
	}
	//component ask the api for the cr
	async load(): Promise<void> {
		this.state = loading();
		this.actionError = undefined;
		try { //calls the mock api
			const detail = await this.api.getChangeRequest(this.session.user, this.id);
			this.state = { status: 'loaded', data: detail }; //api succeeds
		} catch (err) { //if the api fails
			this.state = { status: 'error', data: null, error: (err as Error).message };
		}
	}
	//detail = CR-1
	get detail(): CrDetail | null {
		return this.state.data;
	}
	//this uses the diff function
	get diff(): DiffRow[] {
		return this.detail ? computeDiff(this.detail.baselineLineItems, this.detail.proposedLineItems) : [];
	}

	/** Approval timeline, oldest-first. */
	//arrange time from 9:00 - 9:30 - 10:00
	// TODO: return the audit entries ordered chronologically (oldest first).
	//this.detail?.audit (if cr exists use this audit array)/ [...] (creates a copy if the audit array)
	//sorting calculation for every part of timeline entries we compare timestamps new Date(a.at) so time is in js
	//The timeline is derived from the CR audit history so I copy the audit array to avoid mutating the API state
	// then sort the copy by each entry's timestamp so the UI always renders the history chronologically

	get timeline(): TimelineEntry[] {
	return [...(this.detail?.audit ?? [])].sort(

		(a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()

	);
}

	/** Whether the current user may approve the loaded CR. */
	//should this user approve the cr
	get canApprove(): boolean {
		// NOTE: this only looks at the CR status. The UI must also respect the user's permissions.
		//the cr must be pending approval and also the user has approval policy (approver) its disabled for the viewer
		return this.detail?.status === 'PENDING_APPROVAL' && canApprovePolicy(this.session.user);
	}

	//its only checking the status
	get canReject(): boolean {
		return this.detail?.status === 'PENDING_APPROVAL' && canApprovePolicy(this.session.user);
	}
	//helper to display the money
	fmt(amount: number): string {
		return this.detail ? formatMoney(amount, this.detail.currency) : String(amount);
	}

	//the action when clicking approve 
	// TODO: perform the approve action through the API and reflect the outcome in the view.
	//When Approve is clicked, I first guard against unauthorized or duplicate submissions. 
	// I set a submitting state, call the mock API, and replace the loaded CR with the returned updated CR on success.
	//  On failure I preserve the loaded data and show an action-level error, and finally always clears the submitting state.
	
	async approve(): Promise<void> {

		if(!this.canApprove || this.submitting) return;

		this.submitting = true;
		this.actionError = undefined;

		try {
			const updated = await this.api.approve(

				this.session.user,
				this.id,
				new Date().toISOString()

			);

			this.state = {status: 'loaded', data: updated};
			
		} catch (error) {

			this.actionError = (error as Error).message;
			
		}
		finally {

			this.submitting = false;
		}

		// throw new Error('approve() not implemented');
	}




	//the action when clicking reject
	async reject(): Promise<void> {
		// TODO: require a valid rejectControl, then perform the reject action through the API and
		//       reflect the outcome in the view.
		throw new Error('reject() not implemented');
	}
}
