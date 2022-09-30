use crate::model::{self};
use ::serde::{Deserialize, Serialize};
use futures::future;
use sea_orm::*;
use std::time::{SystemTime, UNIX_EPOCH};
use std::{collections::HashMap, sync::Arc};

use super::user::User;

#[derive(Serialize, Deserialize, Debug)]
pub struct GroupMember {
    id: String,
    nickname: String,
    is_owner: bool,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Group {
    id: String,
    name: String,
    members: Vec<GroupMember>,
}

#[derive(Serialize)]
pub struct Debt {
    pub debtor_id: String,
    pub amount: i32,
    pub was_split_unequally: bool,
}

#[derive(Serialize)]
pub struct Transaction {
    id: String,
    group_id: String,
    timestamp: u32,
    description: String,
    creditor_id: String,
    debts: Vec<Debt>,
}

pub enum TransactionCreationError {
    GroupNotFound,
    DebtorNotInGroup,
}

#[derive(Debug)]
pub struct GroupService {
    db: Arc<DatabaseConnection>,
}

#[derive(FromQueryResult)]
struct CountOfUnequallyChargedDebts {
    debtor_id: String,
    count_of_unequally_charged_debts: u32,
}

#[derive(FromQueryResult)]
struct DebtWithUserInGroup {
    creditor_id: String,
    debt: i32,
}

#[derive(FromQueryResult)]
struct CreditWithUserInGroup {
    debtor_id: String,
    credit: i32,
}

impl Clone for Debt {
    fn clone(&self) -> Self {
        Debt {
            debtor_id: self.debtor_id.clone(),
            amount: self.amount,
            was_split_unequally: self.was_split_unequally,
        }
    }
}

impl Clone for Transaction {
    fn clone(&self) -> Self {
        Transaction {
            id: self.id.clone(),
            group_id: self.group_id.clone(),
            timestamp: self.timestamp.clone(),
            description: self.description.clone(),
            creditor_id: self.creditor_id.clone(),
            debts: self.debts.clone(),
        }
    }
}

impl GroupService {
    pub fn new(db: Arc<DatabaseConnection>) -> GroupService {
        GroupService { db: db }
    }

    pub async fn create_group(&self, name: String, owner: User) -> Group {
        let new_group_id = uuid::Uuid::new_v4().to_string();

        let new_group = model::group::ActiveModel {
            id: ActiveValue::Set(new_group_id.to_owned()),
            name: ActiveValue::Set(name.to_owned()),
        };

        model::group::Entity::insert(new_group)
            .exec(self.db.as_ref())
            .await
            .expect("error creating group");

        assert!(
            self.create_group_member(new_group_id.to_owned(), owner.id.to_owned(), true)
                .await
        );

        Group {
            id: new_group_id,
            name: name,
            members: vec![GroupMember {
                id: owner.id,
                nickname: owner.nickname,
                is_owner: true,
            }],
        }
    }

    pub async fn create_group_member(
        &self,
        group_id: String,
        user_id: String,
        is_owner: bool,
    ) -> bool {
        let res = model::group_member::Entity::insert(model::group_member::ActiveModel {
            user_id: ActiveValue::Set(user_id),
            group_id: ActiveValue::Set(group_id),
            is_owner: ActiveValue::Set(if is_owner { 1 } else { 0 }),
        })
        .exec(self.db.as_ref())
        .await;

        match res {
            Ok(_) => true,
            Err(_) => false,
        }
    }

    pub async fn get_groups_of_user(&self, user_id: String) -> Vec<Group> {
        let groups = model::group_member::Entity::find()
            .filter(model::group_member::Column::UserId.eq(user_id))
            .find_also_related(model::group::Entity)
            .all(self.db.as_ref())
            .await
            .expect("failed to query groups of user")
            .into_iter()
            .map(|(_, group)| self._populate_group_members_and_debt(group.unwrap()));

        future::join_all(groups).await
    }

    pub async fn get_group_of_user(&self, group_id: String, user_id: String) -> Option<Group> {
        let group = model::group_member::Entity::find()
            .filter(model::group_member::Column::UserId.eq(user_id))
            .filter(model::group_member::Column::GroupId.eq(group_id))
            .find_also_related(model::group::Entity)
            .one(self.db.as_ref())
            .await
            .expect("error querying group")
            .map(|(_, group)| group.unwrap());

        match group {
            None => None,
            Some(group) => Some(self._populate_group_members_and_debt(group).await),
        }
    }

    pub async fn get_members_of_group_of_user(
        &self,
        group_id: String,
        user_id: String,
    ) -> Option<Vec<GroupMember>> {
        if !self._is_user_member_of_group(&group_id, &user_id).await {
            return None;
        }

        Some(self._get_group_members(&group_id).await)
    }

    pub async fn create_transaction(
        &self,
        group_id: String,
        creditor_id: String,
        debtor_ids: Vec<String>,
        amount: u32,
        description: String,
    ) -> Result<Transaction, TransactionCreationError> {
        let members = self
            ._get_group_members(&group_id)
            .await
            .into_iter()
            .map(|m| m.id)
            .collect::<Vec<String>>();

        println!("{:?}", members);

        if members.len() == 0 || !members.contains(&creditor_id) {
            return Err(TransactionCreationError::GroupNotFound);
        }

        let mut all_debtors_in_group = true;

        for debtor in &debtor_ids {
            all_debtors_in_group = all_debtors_in_group && members.contains(debtor);
        }

        if !all_debtors_in_group {
            return Err(TransactionCreationError::DebtorNotInGroup);
        }

        Ok(self
            ._create_transaction_with_debt(group_id, creditor_id, debtor_ids, amount, description)
            .await)
    }

    pub async fn get_transactions_of_group_of_user(
        &self,
        group_id: String,
        user_id: String,
    ) -> Option<Vec<Transaction>> {
        if !self._is_user_member_of_group(&group_id, &user_id).await {
            return None;
        }

        Some(
            self._get_tansactions_help(
                model::transaction::Entity::find()
                    .filter(model::transaction::Column::GroupId.eq(group_id)),
            )
            .await,
        )
    }

    pub async fn get_debts_of_user_in_group(
        &self,
        group_id: &str,
        user_id: &str,
    ) -> Option<Vec<Debt>> {
        if !self._is_user_member_of_group(group_id, user_id).await {
            return None;
        }

        let debts_of_user = model::debt::Entity::find()
            .find_also_related(model::transaction::Entity)
            .filter(model::transaction::Column::GroupId.eq(group_id))
            .filter(model::debt::Column::DebtorId.eq(user_id))
            .group_by(model::transaction::Column::CreditorId)
            .column_as(model::debt::Column::Amount.sum(), "B_debt")
            .into_model::<model::debt::Model, DebtWithUserInGroup>()
            .all(self.db.as_ref())
            .await
            .expect("error querying debt of user in group")
            .into_iter()
            .map(|(_, debt)| {
                let debt = debt.unwrap();
                (debt.creditor_id, debt.debt)
            })
            .collect::<HashMap<String, i32>>();

        let credits_of_user = model::debt::Entity::find()
            .find_also_related(model::transaction::Entity)
            .filter(model::transaction::Column::GroupId.eq(group_id))
            .filter(model::transaction::Column::CreditorId.eq(user_id))
            .group_by(model::debt::Column::DebtorId)
            .column_as(model::debt::Column::Amount.sum(), "A_credit")
            .into_model::<CreditWithUserInGroup, model::transaction::Model>()
            .all(self.db.as_ref())
            .await
            .expect("error querying credit of user in group")
            .into_iter()
            .map(|(credit, _)| (credit.debtor_id, credit.credit))
            .collect::<HashMap<String, i32>>();

        Some(
            self._get_group_members(&group_id)
                .await
                .into_iter()
                .filter(|member| member.id != user_id)
                .map(|member| Debt {
                    debtor_id: member.id.to_owned(),
                    amount: credits_of_user.get(&member.id).unwrap_or(&0)
                        - debts_of_user.get(&member.id).unwrap_or(&0),
                    was_split_unequally: false,
                })
                .collect::<Vec<Debt>>(),
        )
    }

    async fn _get_transaction_by_id(&self, transaction_id: String) -> Option<Transaction> {
        match self
            ._get_tansactions_help(model::transaction::Entity::find_by_id(transaction_id))
            .await
            .first()
        {
            Some(t) => Some(t.clone()),
            None => None,
        }
    }

    async fn _get_tansactions_help(
        &self,
        select: Select<model::transaction::Entity>,
    ) -> Vec<Transaction> {
        select
            .find_with_related(model::debt::Entity)
            .order_by(model::transaction::Column::Timestamp, Order::Desc)
            .all(self.db.as_ref())
            .await
            .expect("error querying transaction")
            .into_iter()
            .map(|(transaction, debt)| Transaction {
                id: transaction.id,
                group_id: transaction.group_id,
                timestamp: transaction.timestamp as u32,
                description: transaction.description,
                creditor_id: transaction.creditor_id,
                debts: debt
                    .into_iter()
                    .map(|debt| Debt {
                        debtor_id: debt.debtor_id,
                        amount: debt.amount,
                        was_split_unequally: debt.was_split_unequally == 1,
                    })
                    .collect(),
            })
            .collect::<Vec<Transaction>>()
    }

    async fn _create_transaction(
        &self,
        group_id: &str,
        creditor_id: String,
        description: String,
    ) -> String {
        let new_transaction_id = uuid::Uuid::new_v4().to_string();

        let new_transaction = model::transaction::ActiveModel {
            id: ActiveValue::Set(new_transaction_id.to_owned()),
            group_id: ActiveValue::Set(group_id.to_owned()),
            creditor_id: ActiveValue::Set(creditor_id.to_owned()),
            timestamp: ActiveValue::Set(
                SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs()
                    .try_into()
                    .unwrap(),
            ),
            description: ActiveValue::Set(description.to_owned()),
        };

        model::transaction::Entity::insert(new_transaction)
            .exec(self.db.as_ref())
            .await
            .expect("error creating transaction");

        new_transaction_id
    }

    async fn _create_transaction_with_debt(
        &self,
        group_id: String,
        creditor_id: String,
        debtor_ids: Vec<String>,
        amount: u32,
        description: String,
    ) -> Transaction {
        let transaction_id = self
            ._create_transaction(&group_id, creditor_id, description)
            .await;

        let debts = self
            ._calculate_debt_of_debtors(&group_id, debtor_ids, amount)
            .await
            .into_iter()
            .map(
                |(debtor, amount, was_split_unequally)| model::debt::ActiveModel {
                    transaction_id: ActiveValue::Set(transaction_id.to_owned()),
                    debtor_id: ActiveValue::Set(debtor.to_owned()),
                    amount: ActiveValue::Set(amount as i32),
                    was_split_unequally: ActiveValue::Set(if was_split_unequally { 1 } else { 0 }),
                },
            )
            .collect::<Vec<model::debt::ActiveModel>>();

        for debt in debts {
            model::debt::Entity::insert(debt)
                .exec(self.db.as_ref())
                .await
                .expect("error creating debt");
        }

        self._get_transaction_by_id(transaction_id).await.unwrap()
    }

    async fn _calculate_debt_of_debtors(
        &self,
        group_id: &str,
        debtor_ids: Vec<String>,
        amount: u32,
    ) -> Vec<(String, u32, bool)> {
        let mut debtor_ids = debtor_ids.clone();
        debtor_ids.sort();
        let debtor_count: u32 = debtor_ids.len() as u32;
        let amount_per_debtor: u32 = amount / debtor_count;
        let mut amount_to_split_unequally: u32 = amount - amount_per_debtor * debtor_count;
        let mut unequally_charged_debtors = Vec::new();
        let mut potentially_unequally_charged_debtors = self
            ._get_order_of_debtors_to_be_unequally_charged(group_id, &debtor_ids)
            .await;

        while amount_to_split_unequally > 0 {
            let debtor = potentially_unequally_charged_debtors.pop().unwrap();
            unequally_charged_debtors.push(debtor.clone());
            amount_to_split_unequally -= 1;
        }

        debtor_ids
            .into_iter()
            .map(|debtor| {
                if unequally_charged_debtors.contains(&debtor) {
                    (debtor, amount_per_debtor + 1, true)
                } else {
                    (debtor, amount_per_debtor, false)
                }
            })
            .collect::<Vec<(String, u32, bool)>>()
    }

    async fn _get_order_of_debtors_to_be_unequally_charged(
        &self,
        group_id: &str,
        debtor_ids: &Vec<String>,
    ) -> Vec<String> {
        let mut count_of_unequally_charged_debts = self
            ._get_count_of_unequally_charged_debts_of_debtors_in_group(group_id)
            .await;

        count_of_unequally_charged_debts.sort_by(|a, b| b.1.cmp(&a.1));

        count_of_unequally_charged_debts
            .into_iter()
            .filter(|(debtor, _)| debtor_ids.contains(debtor))
            .map(|(debtor, _)| debtor)
            .collect::<Vec<String>>()
    }

    async fn _get_count_of_unequally_charged_debts_of_debtors_in_group(
        &self,
        group_id: &str,
    ) -> Vec<(String, u32)> {
        model::debt::Entity::find()
            .find_also_related(model::transaction::Entity)
            .filter(model::transaction::Column::GroupId.eq(group_id))
            .group_by(model::debt::Column::DebtorId)
            .column_as(
                model::debt::Column::WasSplitUnequally.sum(),
                "A_count_of_unequally_charged_debts",
            )
            .into_model::<CountOfUnequallyChargedDebts, model::transaction::Model>()
            .all(self.db.as_ref())
            .await
            .expect("error getting counts of unequally charged debts")
            .into_iter()
            .map(|(debt, _)| (debt.debtor_id, debt.count_of_unequally_charged_debts))
            .collect::<Vec<(String, u32)>>()
    }

    async fn _populate_group_members_and_debt(&self, group: model::group::Model) -> Group {
        let members = self._get_group_members(&group.id).await;

        Group {
            id: group.id,
            name: group.name,
            members: members,
        }
    }

    async fn _get_group_members(&self, group_id: &str) -> Vec<GroupMember> {
        model::group_member::Entity::find()
            .filter(model::group_member::Column::GroupId.eq(group_id))
            .find_also_related(model::user::Entity)
            .all(self.db.as_ref())
            .await
            .expect("error loading group members")
            .into_iter()
            .map(|(group_member, user)| {
                let user = user.unwrap();
                GroupMember {
                    id: user.id,
                    nickname: user.nickname,
                    is_owner: group_member.is_owner == 1,
                }
            })
            .collect::<Vec<GroupMember>>()
    }

    async fn _is_user_member_of_group(&self, group_id: &str, user_id: &str) -> bool {
        let res = model::group_member::Entity::find()
            .filter(model::group_member::Column::GroupId.eq(group_id))
            .filter(model::group_member::Column::UserId.eq(user_id))
            .one(self.db.as_ref())
            .await
            .expect("error querying user membership");

        match res {
            Some(_) => true,
            None => false,
        }
    }
}
