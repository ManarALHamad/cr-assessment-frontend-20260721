# Implementation Notes


## 1. What I changed
- I tested the system and discovered two obvious errors with the filter and the proposed changes table then studied the code to make the possible changes by fixing the errors
- I fixed the line-item diff logic so the line is marked as changed when its description, quantity or unit price changes rather than checking only the unit-price.
- I fixed the policy of approval permission so the user must have the correct approval policy as well as a CR in `PENDING_APPROVAL` status.
-  implemented the status filter on the Change Request list. The selected status filters `visibleRows` without changing the original data returned by the API.
- In the timeline section I added chronological ordering so the audit enteries are displayed from oldest 9:00 to newest 10:00.
- Approve and reject action in the button of reject and approve were not working so I implemented these actions using the provided mock API.
- I added reject reason validation so the Change Request cannot be rejected by Mona if there is no reason after typing appropriate reason then the button will become clickable.
- I added action states (submitting) so the button (approve or reject) cannot be submitted multiple times while a request is in progress.
- I added action-level error handling so an API failure does not replace the already loaded CR with a blank/error screen.
- I kept the existing loading, empty and error states so the user always receives feedback while data is being loaded or when something goes wrong.


## 2. Component & state model

- The application has two main views: the Change Request list and the Change Request detail view.

- `CrListComponent` loads the CR summaries from `CrApiService` for the current user. The API result is represented using `ViewState<CrSummary[]>` for loading, loaded, empty, and error states.

- The selected status is stored separately in `statusFilter`. `visibleRows` then derives what should be displayed from the loaded rows. I chose this approach so filtering does not modify the original API data.

- `CrDetailComponent` receives the selected CR ID and loads the details from the mock API. The diff and timeline are derived from the current CR instead of being stored as separate state.

- Approve and Reject use the provided API methods. While either action is running, `submitting` prevents another action from being triggered. If the request succeeds, the returned CR replaces the currently displayed CR. If it fails, the existing CR stays visible and `actionError` displays the failure.


## 3. Invariants I keep


| Invariant | How / where |
|---|---|
| A line item is changed when its description, quantity, or unit price changes | `computeDiff()` |
| Sorting the timeline does not mutate the original audit array | The audit array is copied before `sort()` |
| Timeline entries are displayed oldest first | `timeline` getter |
| Only a `PENDING_APPROVAL` CR can be approved or rejected | `canApprove` and `canReject` |
| Approval and rejection require the appropriate approval policy | `canApprovePolicy()` |
| Read-only users can view CR information but cannot perform reviewer actions | Permission-aware action controls |
| Reject requires a reason | `rejectControl`, `Validators.required`, and the guard in `reject()` |
| Duplicate actions are prevented while a request is running | `submitting` and disabled action buttons |
| An action failure does not remove the loaded CR | `actionError` is separate from the CR view state |
| Filtering does not modify the original API result | `visibleRows` derives the filtered rows |



## 4. Testing strategy
- I used a compination of pure unit tests and Angular component/DOM tests.
- The diff utility is tested directly and components tests are used and tested for the behavior that that matters to the user such as the filter.
- For the list, I tested the loading, empty, and error states as well as the status filter and the rows rendered after filtering.
- For the detail view, I tested the rendered diff, chronological timeline, and permission behavior. I also tested the Approve and Reject flows, including successful actions, API failures, slow requests, and Reject reason validation.
-For asynchronous behavior, I used the controls provided by the mock API such as `latencyMs` and `failNext`. I also checked that actions are disabled while a request is in progress and that an API error does not remove the already loaded CR from the screen.



## 5. Assumptions
- I treated the SKU as the identity of a line item. If the same SKU exists in both baseline and proposed data, I compare its description, quantity, and unit price to decide whether it changed.

- I assumed Approve and Reject use the same approval permission because both are reviewer decisions on a `PENDING_APPROVAL` Change Request.

- I kept read access separate from approval access. A read-only user can still inspect the CR but cannot perform approval or rejection actions.

- I treated the provided mock API as the backend contract and did not add persistence. Because the API stores its data in memory, refreshing the application resets the fixtures.

- I kept the existing behavior where the Approve control is visible but disabled for a read-only user, while still ensuring that the action cannot be performed.

- Filtering only changes which rows are displayed in the list. It does not modify the CR data or automatically change the currently selected CR.


## 6. Where I used AI
- I used AI as a development and learning assistant during the assessment. I mainly used it to help me understand parts of the existing Angular codebase, discuss the intentional bugs, review my permission and state logic, and think through useful test cases.
- I also used AI to explain some Angular and testing concepts that I was less familiar with, especially TestBed, DOM testing, reactive forms, and asynchronous component tests.
- I reviewed the suggested changes before applying them, ran the application and tests myself, and checked the behavior in the browser. I made sure I understood the code I added so I can explain and modify it during the follow-up interview.


## 7. What I'd improve with more time
- I would improve the visual presentation of the diff and timeline so changes are easier to scan quickly.

- I would add clearer visual feedback such as "Approving..." or "Rejecting..." while an action is being processed.

- I would improve the behavior when switching between users from different organizations. For example, if the currently selected CR belongs to the previous organization, I would clear the selection instead of briefly showing a "Not found" state.

- I would spend more time on accessibility, including keyboard navigation and screen-reader feedback for action and validation states.

- I would add a few more edge-case tests for unexpected or malformed API data if this were going into production.
