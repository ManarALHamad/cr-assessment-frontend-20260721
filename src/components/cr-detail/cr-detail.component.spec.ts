import { ComponentFixture, TestBed } from '@angular/core/testing'; //angular testing tools
import { CrDetailComponent } from './cr-detail.component';
import { SessionService } from '../../session/session.service';
import { users } from '../../api/fixtures';
import { ReqUser } from '../../models/cr.models';
import { CrApiService } from '../../api/cr-api.service';
const flush = () => new Promise((r) => setTimeout(r, 0)); //give the pending timer a chance to excute

//its like Create the detail component as Mona and load CR-1.
async function render(user: ReqUser, id: string): Promise<ComponentFixture<CrDetailComponent>> {
	TestBed.configureTestingModule({ //standlone component
		imports: [CrDetailComponent],
		providers: [{ provide: SessionService, useValue: { user } }], //fake user
	});
	await TestBed.compileComponents();
	const fixture = TestBed.createComponent(CrDetailComponent); //angular create instance of crDetailComponent
	fixture.componentInstance.id = id; //cr id
	fixture.detectChanges(); // ngOnInit -> load() (update the html)
	await flush(); // let the mock API resolve (wait for the api)
	fixture.detectChanges(); // render the loaded state (html is rendered again)
	return fixture;
}

describe('CrDetailComponent', () => {
	it('loads and renders the change request title', async () => {
		const fixture = await render(users.approver, 'CR-1');
		expect(fixture.nativeElement.querySelector('.cr-detail__header h2').textContent).toContain('Add 1 unit of SKU-A');
	});

	it('disables Approve for a read-only viewer on a pending CR', async () => {
		const fixture = await render(users.viewer, 'CR-1'); // viewer: cr_r_o only; CR-1 is PENDING_APPROVAL
		const approveBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-actions__approve');  //find the approve button
		expect(approveBtn.disabled).toBe(true);
	});

	it('renders the change request diff correctly', async () => {
	const fixture = await render(users.approver, 'CR-1');
	//we will go to the rendered HTML and find all the rows i the diff table 
	const rows =
		fixture.nativeElement.querySelectorAll('.cr-diff__row');

	expect(rows.length).toBe(2);
	//checking first rendered row
	expect(rows[0].textContent).toContain('SKU-A');
	expect(rows[0].textContent).toContain('changed');
	//checking second rendered row 
	expect(rows[1].textContent).toContain('SKU-B');
	expect(rows[1].textContent).toContain('unchanged');
});

	//chronological timeline DOM test
	it('renders the timeline in chronological order', async () => {
	const fixture = await render(users.approver, 'CR-1');

	const entries =
		fixture.nativeElement.querySelectorAll('.cr-timeline__entry');

	expect(entries.length).toBe(3);
	//proves that the three audit events were rendered
	expect(entries[0].textContent).toContain('CREATE');
	expect(entries[1].textContent).toContain('SUBMIT');
	expect(entries[2].textContent).toContain('SEND_FOR_APPROVAL');
});

	//approve success
	it('approves a pending change request', async () => {
	const fixture = await render(users.approver, 'CR-1');

	const approveBtn: HTMLButtonElement =
		fixture.nativeElement.querySelector('.cr-actions__approve');

	approveBtn.click();

	await flush();
	fixture.detectChanges();

	expect(fixture.componentInstance.detail?.status).toBe('APPROVED');

	const status =
		fixture.nativeElement.querySelector('.cr-status');

	expect(status.textContent).toContain('APPROVED');
});

	//slow approve test (prevent double actions)
	//this proves that approve is clicked so submitting = true button will be disabled 
	// slow api finishes (status will become approved) and submitting = false

	it('disables Approve while the request is in progress', async () => {
	const fixture = await render(users.approver, 'CR-1');

	jest.useFakeTimers();

	try {
		const api = TestBed.inject(CrApiService);
		api.latencyMs = 100;

		const approvePromise = fixture.componentInstance.approve();
		fixture.detectChanges();

		const approveBtn: HTMLButtonElement =
			fixture.nativeElement.querySelector('.cr-actions__approve');

		expect(fixture.componentInstance.submitting).toBe(true);
		expect(approveBtn.disabled).toBe(true);

		jest.advanceTimersByTime(100);
		await approvePromise;
		fixture.detectChanges();

		expect(fixture.componentInstance.submitting).toBe(false);
		expect(fixture.componentInstance.detail?.status).toBe('APPROVED');
	} finally {
		jest.useRealTimers();
	}
});

	//appprove failure unhappy path + keep view coherent

	it('shows an error and keeps the CR visible when Approve fails', async () => {
	const fixture = await render(users.approver, 'CR-1');
	const api = TestBed.inject(CrApiService);

	api.failNext = true;

	await fixture.componentInstance.approve();
	fixture.detectChanges();

	const error =
		fixture.nativeElement.querySelector('.cr-actions__error');

	expect(error).not.toBeNull();
	expect(error.textContent).toContain('Network error');

	expect(
		fixture.nativeElement.querySelector('.cr-detail__header')
	).not.toBeNull();

	expect(fixture.componentInstance.submitting).toBe(false);
});

//Reject Validation this proves that empty reason cannot cause rejection of the CR

it('blocks Reject when the reason is empty', async () => {
	const fixture = await render(users.approver, 'CR-1');

	const rejectBtn: HTMLButtonElement =
		fixture.nativeElement.querySelector('.cr-actions__reject-btn');

	expect(fixture.componentInstance.rejectControl.invalid).toBe(true);
	expect(rejectBtn.disabled).toBe(true);

	await fixture.componentInstance.reject();
	fixture.detectChanges();

	expect(fixture.componentInstance.detail?.status)
		.toBe('PENDING_APPROVAL');

	expect(fixture.componentInstance.rejectControl.touched)
		.toBe(true);
});

//Reject Success this will prove valid reason - reject enabled - api called - status will change to rejected 
//rejection will appear in the timeline and reason appear also
it('rejects a pending CR when a valid reason is provided', async () => {
	const fixture = await render(users.approver, 'CR-1');

	fixture.componentInstance.rejectControl.setValue('Incorrect quantity');
	fixture.detectChanges();

	const rejectBtn: HTMLButtonElement =
		fixture.nativeElement.querySelector('.cr-actions__reject-btn');

	expect(rejectBtn.disabled).toBe(false);

	rejectBtn.click();

	await flush();
	fixture.detectChanges();

	expect(fixture.componentInstance.detail?.status).toBe('REJECTED');

	const status =
		fixture.nativeElement.querySelector('.cr-status');

	expect(status.textContent).toContain('REJECTED');

	const timeline =
		fixture.nativeElement.querySelector('.cr-timeline__list');

	expect(timeline.textContent).toContain('REJECT');
	expect(timeline.textContent).toContain('Incorrect quantity');
});

//Reject failure that gives us the unhappy path for Reject too

it('shows an error and keeps the CR visible when Reject fails', async () => {
	const fixture = await render(users.approver, 'CR-1');
	const api = TestBed.inject(CrApiService);

	fixture.componentInstance.rejectControl.setValue('Incorrect quantity');
	api.failNext = true;

	await fixture.componentInstance.reject();
	fixture.detectChanges();

	const error =
		fixture.nativeElement.querySelector('.cr-actions__error');

	expect(error).not.toBeNull();
	expect(error.textContent).toContain('Network error');

	expect(
		fixture.nativeElement.querySelector('.cr-detail__header')
	).not.toBeNull();

	expect(fixture.componentInstance.submitting).toBe(false);
});


});
