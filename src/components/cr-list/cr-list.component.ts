import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CrApiService } from '../../api/cr-api.service';
import { SessionService } from '../../session/session.service'; //tells us who is the current user
import { CrStatus, CrSummary } from '../../models/cr.models';
import { idle, loading, ViewState } from '../../common/view-state';
// import { it } from 'node:test'; //commented it because it was showing errors

//idle - loading - loaded - empty - error 
/**
 * Change Request LIST page. Loads the caller's CRs and renders loading / loaded / empty / error
 * states, plus a status filter. The load + state handling are provided as the pattern; the status
 * filter (`visibleRows`) is yours to complete. 
 */
//filter in the table on the left is not working we will fix it 

@Component({
	selector: 'app-cr-list',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './cr-list.component.html',
})
export class CrListComponent implements OnInit {
	@Output() select = new EventEmitter<string>();

	state: ViewState<CrSummary[]> = idle(); //similar to detail byt the data is Cr summary
	statusFilter: CrStatus | 'ALL' = 'ALL';
	readonly statuses: (CrStatus | 'ALL')[] = ['ALL', 'DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'APPLIED', 'REJECTED', 'CANCELLED'];

	constructor(private readonly api: CrApiService, private readonly session: SessionService) {} //the component is not suppose to replace the property later

	ngOnInit(): void {
		void this.load();
	}

	async load(): Promise<void> { // load the list from the mock api
		this.state = loading();
		//try and catch because the api might fail or pass
		try {
			//mock api give the CR available to the current user
			const rows = await this.api.listChangeRequests(this.session.user);

			this.state = { status: rows.length ? 'loaded' : 'empty', data: rows };
		} catch (err) {
			//error handling 
			this.state = { status: 'error', data: null, error: (err as Error).message };
		}
	}
	//this get call when the user change the status filter in HTML
	onFilterChange(value: string): void {
		this.statusFilter = value as CrStatus | 'ALL';
	}

	/** Rows to render, after applying the active status filter. */
	//we will apply filter 
	get visibleRows(): CrSummary[] {
		const rows = this.state.data ?? [];
		// TODO: narrow `rows` by `this.statusFilter` ('ALL' shows everything).
		if(this.statusFilter === 'ALL'){

			return rows;

		}
		return rows.filter((cr) => cr.status === this.statusFilter);

		
	}
}
