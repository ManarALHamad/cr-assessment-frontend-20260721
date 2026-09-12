import { ComponentFixture, TestBed } from '@angular/core/testing'; //angular testing tools
import { CrDetailComponent } from './cr-detail.component';
import { SessionService } from '../../session/session.service';
import { users } from '../../api/fixtures';
import { ReqUser } from '../../models/cr.models';

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
});
