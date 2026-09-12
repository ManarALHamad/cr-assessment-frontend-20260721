import { Injectable } from '@angular/core';
import { CrDetail, CrSummary, ReqUser } from '../models/cr.models'; 
// this imports fake data
import { details as fixtureDetails, summaries as fixtureSummaries } from './fixtures';

/**
 * Mock API service standing in for the real HTTP service. It is org-scoped (returns only the
 * caller's org), supports injectable latency, and can be told to fail the next call so the UI's
 * loading/error handling can be exercised.
 *
 * You do NOT need a backend — treat this as the contract your components talk to. (In production
 * this would be an HttpClient-backed service returning Observables; here it returns Promises that
 * resolve on a timer, so they integrate cleanly with Angular's async testing.)
 */

@Injectable({ providedIn: 'root' })
export class CrApiService {
	private detailStore: Record<string, CrDetail> = JSON.parse(JSON.stringify(fixtureDetails));
	/** Set > 0 to simulate network latency (ms). */
	// this controls fake network delay
	latencyMs = 0;
	/** When true, the NEXT call rejects with a network error, then resets. */
	failNext = false;

	private settle<T>(value: T): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			setTimeout(() => {
				if (this.failNext) {
					this.failNext = false;
					reject(new Error('Network error'));
					return;
				}
				resolve(value);
			}, this.latencyMs);
		});
	}
	// this is used when the api needs to return an error
	private fail<T>(message: string): Promise<T> {
		return new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), this.latencyMs));
	}
	//actual api endpoints
	listChangeRequests(user: ReqUser): Promise<CrSummary[]> {
		const rows = fixtureSummaries //fake list of crs
			.filter((s) => s.orgCode === user.orgCode)
			.map((s) => { //for every CR summary yt creates the data that will be returned
				const d = this.detailStore[s.id];  //return detailed version of cr
				return d ? { id: d.id, title: d.title, status: d.status, orgCode: d.orgCode, delta: d.delta, currency: d.currency, updatedAt: d.updatedAt } : { ...s };
			});
		return this.settle(rows);
	}
//detail of one specific CR it checks first it it exists or belongs to another organization
	getChangeRequest(user: ReqUser, id: string): Promise<CrDetail> {
		const cr = this.detailStore[id];
		if (!cr || cr.orgCode !== user.orgCode) return this.fail<CrDetail>('Not found');
		return this.settle({ ...cr });
	}
//approve the Change request and record the action as approves
	approve(user: ReqUser, id: string, at: string): Promise<CrDetail> {
		return this.transition(user, id, 'APPROVED', 'APPROVE', at);
	}
//same as approve but this needs reason to reject 
	reject(user: ReqUser, id: string, at: string, reason: string): Promise<CrDetail> {
		return this.transition(user, id, 'REJECTED', 'REJECT', at, reason);
	}

//this function receives user, CR ID, etc for approve of reject it finds the cr and then creates the updated cr 
//then after checking and updating ut returns the updated CR through the fake network

	private transition(user: ReqUser, id: string, status: CrDetail['status'], action: string, at: string, note?: string): Promise<CrDetail> {
		const cr = this.detailStore[id];
		if (!cr || cr.orgCode !== user.orgCode) return this.fail<CrDetail>('Not found');
		const updated: CrDetail = { ...cr, status, updatedAt: at, audit: [...cr.audit, { action, byUserId: user.id, at, note }] };
		this.detailStore[id] = updated;
		return this.settle({ ...updated });
	}
}

//API controls the data (eg: the CR status) and angular componenet controls
//the UI (eg: approve button & filters)