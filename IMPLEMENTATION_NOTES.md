# Implementation Notes

> Fill this in as part of your submission. 1–2 pages, bullet points are fine. Delete these
> instructions before submitting.

## 1. What I changed
- I tested the system and discovered two obvious errors with the filter and the proposed changes table then studied the code to make the possible changes by fixing the errors
- I fixed the line-item diff logic so the line is marked as changed when its description, quantity or unit price changes rather than checking only the unit-price.
- I fixed the policy of approval permission so the user must have the correct approval policy as well as a CR in `PENDING_APPROVAL` status.
- The filter was not working properlyin the change requests table so I implemented and tested this filter.
- In the timeline section I added chronological ordering so the audit enteries are displayed from oldest 9:00 to newest 10:00.
- Approve and reject action in the button of reject and approve were not working so I implemented these actions using the mock api.
- I added reject reason validation so the Change Request cannot be rejected by Mona if there is no reason after typing appropriate reason then the button will become clickable.
- I added action states so the button (approve or reject) cannot be submitted multiple times while a request is in progress.
- I added action-level error handling so an API failure does not replace the already loaded CR with a blank/error screen.
- I kept the existing loading, empty and error states so the user always receives feedback while data is being loaded or when something goes wrong.


## 2. Component & state model

- This appliaction has Change request list and Change request detail view.
- `CrListComponent` loads the CR summaries from `CrApiService` for the current user as it keeps the API result in a `ViewState<CrSummary[]>`, which represents loading, loaded, empty, and error states. The selected status is stored separately in `statusFilter`, and `visibleRows` derives the rows that should be rendered without modifying the original API data.
- `CrDetailComponent` receives the selected CR ID and loads its detail from the mock API. The loaded CR is also stored using `ViewState`. The diff and timeline are derived from the current CR rather than stored as separate mutable state.
- Approve and Reject call the provided mock API. While an action is running, `submitting` prevents duplicate actions. On success, the component replaces the current CR with the updated CR returned by the API. On failure, the existing CR remains visible and `actionError` is used to show the error to the user.


## 3. Invariants I keep
<!-- Which properties the UI guarantees, and where in the component/template each is enforced. -->

| Invariant | How / where |
|---|---|
| A line-item change is detected when description, quantity, or unit price changes | `computeDiff()` |
| The original CR/audit data is not mutated when ordering the timeline | The audit array is copied before calling `sort()` |
| Timeline entries are displayed oldest first | `timeline` getter in `CrDetailComponent` |
| Only a `PENDING_APPROVAL` CR can be approved or rejected | `canApprove` and `canReject` |
| Approval/rejection also requires an approval policy | `canApprovePolicy()` |
| Read-only users can view CR data but cannot perform reviewer actions | Permission-aware action controls |
| Reject requires a reason | `rejectControl` with `Validators.required` and the guard inside `reject()` |
| Duplicate actions are prevented while an API request is running | `submitting` guard and disabled action buttons |
| An action failure does not remove already loaded CR data | `actionError` is kept separately from the CR view state |
| Status filtering does not modify the original list returned by the API | `visibleRows` derives a filtered array |


## 4. Testing strategy
- I used a compination of pure unit tests and Angular coponent/DOM tests
- The diff utility is tested directly and components tests are used and tested for the behavior that that matters to the user such as the filter.


## 5. Assumptions
<!-- Where the requirements left room for interpretation, the calls you made and why. -->

-

## 6. Where I used AI
-

## 7. What I'd improve with more time
-
