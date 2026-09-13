import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrListComponent } from './cr-list.component';
import { SessionService } from '../../session/session.service';
import { users } from '../../api/fixtures';
import { ReqUser } from '../../models/cr.models';
import { CrApiService } from '../../api/cr-api.service';

const flush = () => new Promise((r) => setTimeout(r, 0));

async function render(user: ReqUser): Promise<ComponentFixture<CrListComponent>> {
	TestBed.configureTestingModule({
		imports: [CrListComponent],
		providers: [{ provide: SessionService, useValue: { user } }],
	});
	await TestBed.compileComponents();
	const fixture = TestBed.createComponent(CrListComponent);
	fixture.detectChanges(); // ngOnInit -> load()
	await flush(); // let the mock API resolve by giving it time 
	fixture.detectChanges(); // render the loaded/empty state
	return fixture;
}

describe('CrListComponent', () => {
	it('renders a row per change request in the user org', async () => { //org-alpha only Mona can approveor reject
		const fixture = await render(users.approver);
		expect(fixture.nativeElement.querySelectorAll('.cr-list__row').length).toBe(3); // org-alpha: CR-1, CR-2, CR-3
	});

	it('shows the empty state when the org has no change requests', async () => {
		const fixture = await render({ id: 'x', orgCode: 'org-empty', policies: ['cr_r_o'] });
		expect(fixture.nativeElement.querySelector('.cr-list__empty')).not.toBeNull();
		expect(fixture.nativeElement.querySelector('.cr-list__table')).toBeNull();
	});
	//filter testing
		it('filters the rendered rows by status', async() => {
	    const fixture = await render(users.approver);  //render the list as Mona
		const select: HTMLSelectElement =
		fixture.nativeElement.querySelector('.cr-list__filter');

		select.value = 'APPLIED';
		select.dispatchEvent(new Event('change'));

		fixture.detectChanges();

		const rows =
		fixture.nativeElement.querySelectorAll('.cr-list__row');

		expect(rows.length).toBe(1);
		expect(rows[0].textContent).toContain('CR-2');

	});
	//loading state list so here we will slow the API down so we have time to inspect the DOM
	//while its loading so what we wanna catch is API req starts - state = loading - here we will check the DOM
	//API will finish and state will be loaded

	it('shows the loading state while change requests are being loaded', async () => {
	TestBed.configureTestingModule({
		imports: [CrListComponent],
		providers: [
			{
				provide: SessionService,
				useValue: { user: users.approver }
			}
		],
	});

	await TestBed.compileComponents();

	const api = TestBed.inject(CrApiService); //gets the mock api
	api.latencyMs = 100; //pretend that the api takes 100ms

	const fixture = TestBed.createComponent(CrListComponent);

	fixture.detectChanges();
	//inspect HTML
	const loadingMessage =
		fixture.nativeElement.querySelector('.cr-list__loading');
	//prove its actually visible
	expect(loadingMessage).not.toBeNull();
	expect(loadingMessage.textContent).toContain('Loading change requests');

	await new Promise((resolve) => setTimeout(resolve, 100)); //final wait
});

//Error-state test 

it('shows an error state when loading change requests fails', async () => {
	TestBed.configureTestingModule({
		imports: [CrListComponent],
		providers: [
			{
				provide: SessionService,
				useValue: { user: users.approver }
			}
		],
	});

	await TestBed.compileComponents();

	const api = TestBed.inject(CrApiService);
	api.failNext = true; //this tells the mock api that the next api should fail

	const fixture = TestBed.createComponent(CrListComponent);

	fixture.detectChanges();

	await flush();
	fixture.detectChanges(); //starts ngOnInit - load so api fails with network error

	const errorMessage =
		fixture.nativeElement.querySelector('.cr-list__error');

	expect(errorMessage).not.toBeNull();
	expect(errorMessage.textContent).toContain('Network error');

	expect(
		fixture.nativeElement.querySelector('.cr-list__table')
	).toBeNull();
});





});
