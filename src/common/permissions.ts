import { ReqUser } from '../models/cr.models';

/** Policy-string helpers. Policies are `cr_{action}_{scope}` (see README). */
//does this user has this permission
//user exist and has the policy 
export function hasPolicy(user: ReqUser, policy: string): boolean {
	return !!user && user.policies.includes(policy);
}

/** Any approve-scope policy. */
//.some oes at least one of the policies is satisfied
export function canApprovePolicy(user: ReqUser): boolean {
	return ['cr_a_u', 'cr_a_w', 'cr_a_o'].some((p) => hasPolicy(user, p));
}
