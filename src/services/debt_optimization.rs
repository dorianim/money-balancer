use std::collections::{BTreeMap, HashMap};

type DebtGraph = BTreeMap<String, BTreeMap<String, i64>>;

const MAX_SUBSET_DP_ACCOUNTS: usize = 20;
const MAX_MEMOIZED_SEARCH_ACCOUNTS: usize = 128;
const MEMOIZED_SEARCH_MEMORY_BUDGET_BYTES: usize = 32 * 1024 * 1024;
const MEMOIZED_SEARCH_BALANCE_WORK_BUDGET: usize = 20_000_000;
const ESTIMATED_MEMO_ENTRY_OVERHEAD_BYTES: usize = 64;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum DebtCalculationError {
    OptimizationResourceLimitExceeded,
}

#[derive(Debug, PartialEq, Eq)]
pub(super) struct OptimizedDebts {
    graph: DebtGraph,
}

impl OptimizedDebts {
    /// Positive means the counterparty owes the user; negative means the user
    /// owes the counterparty.
    pub(super) fn signed_amount_for(&self, user_id: &str, counterparty_id: &str) -> i64 {
        debt_amount(&self.graph, counterparty_id, user_id)
            - debt_amount(&self.graph, user_id, counterparty_id)
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct Settlement {
    debtor_id: String,
    creditor_id: String,
    amount: i64,
}

pub(super) fn optimize_debt_transactions<I>(
    debts: I,
) -> Result<OptimizedDebts, DebtCalculationError>
where
    I: IntoIterator<Item = (String, String, i64)>,
{
    let mut balances = BTreeMap::<String, i64>::new();

    for (debtor_id, creditor_id, amount) in debts {
        assert!(amount >= 0, "stored debt amounts must not be negative");
        if amount == 0 || debtor_id == creditor_id {
            continue;
        }

        let debtor_balance = balances.entry(debtor_id).or_default();
        *debtor_balance = debtor_balance
            .checked_sub(amount)
            .expect("total debt of a group member exceeds i64");
        let creditor_balance = balances.entry(creditor_id).or_default();
        *creditor_balance = creditor_balance
            .checked_add(amount)
            .expect("total credit of a group member exceeds i64");
    }

    let accounts = balances
        .into_iter()
        .filter(|(_, balance)| *balance != 0)
        .collect::<Vec<(String, i64)>>();
    let total_balance = accounts
        .iter()
        .map(|(_, balance)| i128::from(*balance))
        .sum::<i128>();
    assert_eq!(total_balance, 0, "group balances must sum to zero");

    let settlements = settle_balances_exactly(&accounts)?;
    let graph = settlements.into_iter().fold(
        DebtGraph::new(),
        |mut graph,
         Settlement {
             debtor_id,
             creditor_id,
             amount,
         }| {
            let debt = graph
                .entry(debtor_id)
                .or_default()
                .entry(creditor_id)
                .or_default();
            *debt = debt
                .checked_add(amount)
                .expect("settled debt between two members exceeds i64");
            graph
        },
    );

    Ok(OptimizedDebts { graph })
}

// Maximizing the number of disjoint zero-sum account groups minimizes the
// transfer count. Subset DP is predictable for small groups; larger groups use
// a bounded exact search and report an error instead of returning an estimate.
fn settle_balances_exactly(
    accounts: &[(String, i64)],
) -> Result<Vec<Settlement>, DebtCalculationError> {
    if accounts.len() > MAX_SUBSET_DP_ACCOUNTS {
        return settle_balances_with_memoized_search(accounts);
    }

    Ok(settle_balances_with_subset_dp(accounts))
}

fn settle_balances_with_subset_dp(accounts: &[(String, i64)]) -> Vec<Settlement> {
    if accounts.is_empty() {
        return Vec::new();
    }

    let state_count = 1_usize
        .checked_shl(accounts.len() as u32)
        .expect("too many accounts for exact debt settlement");
    let mut subset_sums = vec![0_i128; state_count];
    let mut zero_sum_group_counts = vec![0_u8; state_count];
    let mut removed_account = vec![0_u8; state_count];

    for mask in 1..state_count {
        let account_index = mask.trailing_zeros() as usize;
        let previous_mask = mask & (mask - 1);
        subset_sums[mask] = subset_sums[previous_mask] + i128::from(accounts[account_index].1);

        let mut remaining_accounts = mask;
        let mut best_previous_group_count = 0_u8;
        let mut best_account_index = None;
        while remaining_accounts != 0 {
            let candidate_index = remaining_accounts.trailing_zeros() as usize;
            let candidate_previous_mask = mask ^ (1 << candidate_index);
            let candidate_group_count = zero_sum_group_counts[candidate_previous_mask];
            if best_account_index.is_none() || candidate_group_count > best_previous_group_count {
                best_previous_group_count = candidate_group_count;
                best_account_index = Some(candidate_index);
            }
            remaining_accounts &= remaining_accounts - 1;
        }

        zero_sum_group_counts[mask] =
            best_previous_group_count + if subset_sums[mask] == 0 { 1 } else { 0 };
        removed_account[mask] =
            best_account_index.expect("a non-empty settlement state must contain an account") as u8;
    }

    let full_mask = state_count - 1;
    let optimal_group_count = zero_sum_group_counts[full_mask] as usize;
    let mut zero_sum_groups = Vec::<Vec<usize>>::with_capacity(optimal_group_count);
    let mut current_group = Vec::new();
    let mut mask = full_mask;
    while mask != 0 {
        let account_index = removed_account[mask] as usize;
        current_group.push(account_index);
        mask ^= 1 << account_index;
        if subset_sums[mask] == 0 {
            zero_sum_groups.push(std::mem::take(&mut current_group));
        }
    }

    assert!(current_group.is_empty());
    assert_eq!(zero_sum_groups.len(), optimal_group_count);
    let settlements = zero_sum_groups
        .iter()
        .flat_map(|group| settle_zero_sum_group(accounts, group))
        .collect::<Vec<Settlement>>();
    assert_eq!(settlements.len(), accounts.len() - optimal_group_count);
    settlements
}

#[derive(Clone, Copy, Debug)]
struct SearchStep {
    transaction_count: usize,
    partner_index: usize,
}

#[derive(Clone, Copy, Debug)]
struct SearchBudget {
    remaining_states: usize,
    remaining_transitions: usize,
}

impl SearchBudget {
    fn for_account_count(account_count: usize) -> Result<Self, DebtCalculationError> {
        if account_count > MAX_MEMOIZED_SEARCH_ACCOUNTS {
            return Err(DebtCalculationError::OptimizationResourceLimitExceeded);
        }
        let estimated_entry_bytes = account_count
            .checked_mul(std::mem::size_of::<i64>())
            .and_then(|bytes| bytes.checked_add(ESTIMATED_MEMO_ENTRY_OVERHEAD_BYTES))
            .ok_or(DebtCalculationError::OptimizationResourceLimitExceeded)?;

        Ok(Self {
            remaining_states: MEMOIZED_SEARCH_MEMORY_BUDGET_BYTES / estimated_entry_bytes,
            remaining_transitions: MEMOIZED_SEARCH_BALANCE_WORK_BUDGET / account_count,
        })
    }

    fn visit_state(&mut self) -> Result<(), DebtCalculationError> {
        self.remaining_states = self
            .remaining_states
            .checked_sub(1)
            .ok_or(DebtCalculationError::OptimizationResourceLimitExceeded)?;
        Ok(())
    }

    fn try_transition(&mut self) -> Result<(), DebtCalculationError> {
        self.remaining_transitions = self
            .remaining_transitions
            .checked_sub(1)
            .ok_or(DebtCalculationError::OptimizationResourceLimitExceeded)?;
        Ok(())
    }
}

fn settle_balances_with_memoized_search(
    accounts: &[(String, i64)],
) -> Result<Vec<Settlement>, DebtCalculationError> {
    let all_account_indices = (0..accounts.len()).collect::<Vec<usize>>();
    let direct_settlement = settle_zero_sum_group(accounts, &all_account_indices);
    let (debtor_count, creditor_count) =
        accounts
            .iter()
            .fold((0_usize, 0_usize), |(debtors, creditors), (_, balance)| {
                if *balance < 0 {
                    (debtors + 1, creditors)
                } else {
                    (debtors, creditors + 1)
                }
            });
    if direct_settlement.len() == debtor_count.max(creditor_count) {
        return Ok(direct_settlement);
    }

    let mut balances = accounts
        .iter()
        .map(|(_, balance)| *balance)
        .collect::<Vec<i64>>();
    let mut memo = HashMap::<Vec<i64>, SearchStep>::new();
    let mut budget = SearchBudget::for_account_count(accounts.len())?;
    let optimal_transaction_count =
        minimum_transaction_count(&mut balances, &mut memo, &mut budget)?;

    let mut settlements = Vec::new();
    loop {
        let Some(account_index) = balances.iter().position(|balance| *balance != 0) else {
            break;
        };
        let balance = balances[account_index];
        let step = memo
            .get(&balances)
            .expect("every non-terminal settlement state must have a search step");
        let partner_index = step.partner_index;
        settlements.push(if balance < 0 {
            Settlement {
                debtor_id: accounts[account_index].0.clone(),
                creditor_id: accounts[partner_index].0.clone(),
                amount: balance
                    .checked_neg()
                    .expect("group balances exceed the supported range"),
            }
        } else {
            Settlement {
                debtor_id: accounts[partner_index].0.clone(),
                creditor_id: accounts[account_index].0.clone(),
                amount: balance,
            }
        });

        balances[account_index] = 0;
        balances[partner_index] = balances[partner_index]
            .checked_add(balance)
            .expect("group balances exceed the supported range");
    }

    assert_eq!(settlements.len(), optimal_transaction_count);
    Ok(settlements)
}

fn minimum_transaction_count(
    balances: &mut [i64],
    memo: &mut HashMap<Vec<i64>, SearchStep>,
    budget: &mut SearchBudget,
) -> Result<usize, DebtCalculationError> {
    let Some(account_index) = balances.iter().position(|balance| *balance != 0) else {
        return Ok(0);
    };
    if let Some(step) = memo.get(balances) {
        return Ok(step.transaction_count);
    }
    budget.visit_state()?;

    let state = balances.to_vec();
    let balance = balances[account_index];
    balances[account_index] = 0;
    let (mut debtor_count, mut creditor_count) = balances[account_index + 1..].iter().fold(
        (0_usize, 0_usize),
        |(debtors, creditors), balance| {
            if *balance < 0 {
                (debtors + 1, creditors)
            } else if *balance > 0 {
                (debtors, creditors + 1)
            } else {
                (debtors, creditors)
            }
        },
    );
    if balance < 0 {
        debtor_count += 1;
    } else {
        creditor_count += 1;
    }
    let lower_bound = debtor_count.max(creditor_count);
    let mut best_step = None;
    let mut seen_partner_balances = Vec::<i64>::new();

    let search_result = (|| {
        for partner_index in account_index + 1..balances.len() {
            let partner_balance = balances[partner_index];
            if partner_balance == 0
                || partner_balance.is_negative() == balance.is_negative()
                || seen_partner_balances.contains(&partner_balance)
            {
                continue;
            }
            seen_partner_balances.push(partner_balance);
            budget.try_transition()?;

            balances[partner_index] = partner_balance
                .checked_add(balance)
                .expect("group balances exceed the supported range");
            let child_result = minimum_transaction_count(balances, memo, budget);
            balances[partner_index] = partner_balance;
            let transaction_count = 1 + child_result?;

            if best_step
                .map(|step: SearchStep| transaction_count < step.transaction_count)
                .unwrap_or(true)
            {
                best_step = Some(SearchStep {
                    transaction_count,
                    partner_index,
                });
            }

            if transaction_count == lower_bound || partner_balance.checked_add(balance) == Some(0) {
                break;
            }
        }
        best_step.ok_or(DebtCalculationError::OptimizationResourceLimitExceeded)
    })();
    balances[account_index] = balance;

    let best_step = search_result?;
    memo.insert(state, best_step);
    Ok(best_step.transaction_count)
}

fn settle_zero_sum_group(accounts: &[(String, i64)], account_indices: &[usize]) -> Vec<Settlement> {
    let mut debtors = account_indices
        .iter()
        .filter_map(|index| {
            let (user_id, balance) = &accounts[*index];
            (*balance < 0).then(|| {
                (
                    user_id.clone(),
                    balance.checked_neg().expect("group balances exceed i64"),
                )
            })
        })
        .collect::<Vec<(String, i64)>>();
    let mut creditors = account_indices
        .iter()
        .filter_map(|index| {
            let (user_id, balance) = &accounts[*index];
            (*balance > 0).then(|| (user_id.clone(), *balance))
        })
        .collect::<Vec<(String, i64)>>();
    debtors.sort_by(|a, b| a.0.cmp(&b.0));
    creditors.sort_by(|a, b| a.0.cmp(&b.0));

    let mut settlements = Vec::new();
    let (mut debtor_index, mut creditor_index) = (0, 0);
    while debtor_index < debtors.len() && creditor_index < creditors.len() {
        let amount = debtors[debtor_index].1.min(creditors[creditor_index].1);
        settlements.push(Settlement {
            debtor_id: debtors[debtor_index].0.clone(),
            creditor_id: creditors[creditor_index].0.clone(),
            amount,
        });
        debtors[debtor_index].1 -= amount;
        creditors[creditor_index].1 -= amount;
        if debtors[debtor_index].1 == 0 {
            debtor_index += 1;
        }
        if creditors[creditor_index].1 == 0 {
            creditor_index += 1;
        }
    }

    assert_eq!(debtor_index, debtors.len());
    assert_eq!(creditor_index, creditors.len());
    settlements
}

fn debt_amount(graph: &DebtGraph, debtor_id: &str, creditor_id: &str) -> i64 {
    graph
        .get(debtor_id)
        .and_then(|outgoing| outgoing.get(creditor_id))
        .copied()
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn debt(debtor_id: &str, creditor_id: &str, amount: i64) -> (String, String, i64) {
        (debtor_id.to_owned(), creditor_id.to_owned(), amount)
    }

    fn optimize<I>(debts: I) -> OptimizedDebts
    where
        I: IntoIterator<Item = (String, String, i64)>,
    {
        optimize_debt_transactions(debts).expect("test settlement to fit the resource budget")
    }

    fn graph_debts(debts: &OptimizedDebts) -> Vec<(String, String, i64)> {
        debts
            .graph
            .iter()
            .flat_map(|(debtor_id, outgoing)| {
                outgoing
                    .iter()
                    .map(|(creditor_id, amount)| (debtor_id.clone(), creditor_id.clone(), *amount))
            })
            .collect()
    }

    fn net_balances<I>(debts: I) -> BTreeMap<String, i64>
    where
        I: IntoIterator<Item = (String, String, i64)>,
    {
        let mut balances = BTreeMap::<String, i64>::new();
        for (debtor_id, creditor_id, amount) in debts {
            *balances.entry(debtor_id).or_default() -= amount;
            *balances.entry(creditor_id).or_default() += amount;
        }
        balances.retain(|_, balance| *balance != 0);
        balances
    }

    #[test]
    fn minimizes_first_user_example() {
        let original = vec![debt("a", "b", 30), debt("b", "c", 40), debt("c", "a", 20)];
        let resolved = optimize(original.clone());

        assert_eq!(debt_amount(&resolved.graph, "a", "c"), 10);
        assert_eq!(debt_amount(&resolved.graph, "b", "c"), 10);
        assert_eq!(graph_debts(&resolved).len(), 2);

        assert_eq!(resolved.signed_amount_for("a", "b"), 0);
        assert_eq!(resolved.signed_amount_for("a", "c"), -10);
        assert_eq!(resolved.signed_amount_for("b", "a"), 0);
        assert_eq!(resolved.signed_amount_for("b", "c"), -10);
        assert_eq!(resolved.signed_amount_for("c", "a"), 10);
        assert_eq!(resolved.signed_amount_for("c", "b"), 10);

        assert_eq!(net_balances(original), net_balances(graph_debts(&resolved)));
    }

    #[test]
    fn fully_cancels_an_equal_cycle() {
        let original = vec![
            debt("a", "b", 100),
            debt("b", "c", 100),
            debt("c", "a", 100),
        ];
        let resolved = optimize(original.clone());

        assert!(resolved.graph.is_empty());
        assert_eq!(net_balances(original), net_balances(graph_debts(&resolved)));
    }

    #[test]
    fn minimizes_second_user_example_to_one_transaction() {
        let original = vec![debt("a", "b", 10), debt("a", "c", 10), debt("b", "c", 10)];
        let resolved = optimize(original.clone());

        assert_eq!(graph_debts(&resolved), vec![debt("a", "c", 20)]);
        assert_eq!(net_balances(original), net_balances(graph_debts(&resolved)));
    }

    #[test]
    fn finds_exact_minimum_when_simple_greedy_matching_does_not() {
        let original = vec![
            debt("d8", "c8", 8),
            debt("d7", "c12", 7),
            debt("d6", "c10", 6),
            debt("d5", "c12", 5),
            debt("d4", "c10", 4),
        ];
        let resolved = optimize(original.clone());

        // The balances partition into (8, -8), (12, -7, -5), and
        // (10, -6, -4), so five transfers are optimal. A simple sorted
        // debtor/creditor matcher needs seven for these balances.
        assert_eq!(graph_debts(&resolved).len(), 5);
        assert_eq!(net_balances(original), net_balances(graph_debts(&resolved)));
    }

    #[test]
    fn settlement_is_deterministic_and_idempotent() {
        let original = vec![
            debt("a", "c", 5),
            debt("b", "d", 5),
            debt("a", "d", 5),
            debt("b", "c", 5),
        ];
        let mut reversed = original.clone();
        reversed.reverse();

        let resolved = optimize(original);
        let resolved_from_reversed_input = optimize(reversed);
        let resolved_again = optimize(graph_debts(&resolved));

        assert_eq!(resolved, resolved_from_reversed_input);
        assert_eq!(resolved, resolved_again);
        assert_eq!(graph_debts(&resolved).len(), 2);
    }

    #[test]
    fn supports_aggregate_amounts_above_i32_max() {
        let amount = i64::from(i32::MAX) + 1;
        let original = vec![debt("a", "b", amount), debt("a", "b", amount)];
        let resolved = optimize(original.clone());

        assert_eq!(debt_amount(&resolved.graph, "a", "b"), amount * 2);
        assert_eq!(net_balances(original), net_balances(graph_debts(&resolved)));
    }

    #[test]
    fn exactly_optimizes_more_accounts_than_the_subset_dp_limit() {
        let mut original = vec![
            debt("a8", "zz14", 8),
            debt("b5", "x10", 5),
            debt("c5", "x10", 5),
        ];
        original.extend((0..4).map(|index| debt(&format!("m{index:02}"), "y4", 1)));
        original.extend((4..8).map(|index| debt(&format!("m{index:02}"), "z4", 1)));
        original.extend((8..14).map(|index| debt(&format!("m{index:02}"), "zz14", 1)));
        assert_eq!(net_balances(original.clone()).len(), 21);

        let resolved = optimize(original.clone());

        // Each of the 17 debtors needs an outgoing transfer, establishing a
        // lower bound of 17; the exact search reaches that bound.
        assert_eq!(graph_debts(&resolved).len(), 17);
        assert_eq!(net_balances(original), net_balances(graph_debts(&resolved)));
    }

    #[test]
    fn memoized_search_handles_a_counterparty_that_changes_sides() {
        let accounts = vec![
            ("a".to_owned(), -10),
            ("b".to_owned(), 4),
            ("c".to_owned(), 6),
        ];
        let resolved = settle_balances_with_memoized_search(&accounts)
            .expect("test settlement to fit the resource budget");

        assert_eq!(resolved.len(), 2);
        assert_eq!(
            net_balances(resolved.into_iter().map(|debt| (
                debt.debtor_id,
                debt.creditor_id,
                debt.amount
            ))),
            BTreeMap::from([
                ("a".to_owned(), -10),
                ("b".to_owned(), 4),
                ("c".to_owned(), 6),
            ])
        );
    }

    #[test]
    fn memoized_search_matches_subset_dp_on_small_cases() {
        let balance_cases = [
            vec![-10, -10, 20],
            vec![-20, 20],
            vec![-10, 4, 6],
            vec![-8, -7, -6, -5, -4, 12, 10, 8],
            vec![-9, -6, -4, -3, 8, 7, 5, 2],
        ];

        for balances in balance_cases {
            let accounts = balances
                .into_iter()
                .enumerate()
                .map(|(index, balance)| (format!("user-{index:02}"), balance))
                .collect::<Vec<(String, i64)>>();
            let subset_dp = settle_balances_with_subset_dp(&accounts);
            let memoized_search = settle_balances_with_memoized_search(&accounts)
                .expect("test settlement to fit the resource budget");

            assert_eq!(memoized_search.len(), subset_dp.len());
            assert_eq!(
                net_balances(memoized_search.into_iter().map(|debt| (
                    debt.debtor_id,
                    debt.creditor_id,
                    debt.amount
                ))),
                accounts.into_iter().collect::<BTreeMap<String, i64>>()
            );
        }
    }

    #[test]
    fn memoized_search_stops_when_its_resource_budget_is_exhausted() {
        let mut balances = [-8, -7, -6, -5, -4, 12, 10, 8];
        let mut memo = HashMap::new();
        let mut budget = SearchBudget {
            remaining_states: 1,
            remaining_transitions: 1,
        };

        assert_eq!(
            minimum_transaction_count(&mut balances, &mut memo, &mut budget),
            Err(DebtCalculationError::OptimizationResourceLimitExceeded)
        );
        assert_eq!(balances, [-8, -7, -6, -5, -4, 12, 10, 8]);
    }

    #[test]
    fn large_directly_optimal_settlements_bypass_recursive_search() {
        let mut accounts = (0..128)
            .map(|index| (format!("debtor-{index:03}"), -1))
            .collect::<Vec<(String, i64)>>();
        accounts.push(("creditor".to_owned(), 128));

        let resolved = settle_balances_with_memoized_search(&accounts)
            .expect("a settlement at the proven lower bound not to need search");

        assert_eq!(resolved.len(), 128);
    }

    #[test]
    fn large_nontrivial_settlements_return_a_bounded_resource_error() {
        let mut accounts = vec![
            ("a-d8".to_owned(), -8),
            ("a-d7".to_owned(), -7),
            ("a-d6".to_owned(), -6),
            ("a-d5".to_owned(), -5),
            ("a-d4".to_owned(), -4),
            ("a-c12".to_owned(), 12),
            ("a-c10".to_owned(), 10),
            ("a-c8".to_owned(), 8),
        ];
        for index in 0..61 {
            accounts.push((format!("z-debtor-{index:02}"), -1_000));
            accounts.push((format!("z-creditor-{index:02}"), 1_000));
        }
        assert!(accounts.len() > MAX_MEMOIZED_SEARCH_ACCOUNTS);

        assert_eq!(
            settle_balances_with_memoized_search(&accounts),
            Err(DebtCalculationError::OptimizationResourceLimitExceeded)
        );
    }
}
